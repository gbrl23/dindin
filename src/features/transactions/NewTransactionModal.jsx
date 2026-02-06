import React, { useState, useEffect } from 'react';
import { X, Users, CreditCard, Repeat, Check, Calendar, User, Search, Plus } from 'lucide-react';
import { validateAmount, validateDescription, validateDate, validateAll, errorInputStyle, getErrorMessageStyle } from '../../utils/validation';
import { useTransactions } from '../../hooks/useTransactions';
import { useProfiles } from '../../hooks/useProfiles';
import { useCards } from '../../hooks/useCards';
import { useGroups } from '../../hooks/useGroups';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../contexts/AuthContext';
import NewCategoryModal from '../categories/NewCategoryModal';
import NewCardModal from '../cards/NewCardModal';

export default function NewTransactionModal({ onClose, onSuccess, initialType = 'expense' }) {
    const { user } = useAuth();
    const { profiles } = useProfiles();
    const { cards } = useCards();
    const { groups, getGroupMembers } = useGroups();
    const { addTransactionsBulk } = useTransactions();
    const { categories, refreshCategories } = useCategories();

    // UI State
    const [type, setType] = useState(initialType);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    // Helper: Format Date to YYYY-MM-DD using LOCAL timezone
    const formatLocalDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const [date, setDate] = useState(formatLocalDate(new Date()));
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    // Filter categories by type
    const availableCategories = categories.filter(c => c.type === type);

    // Feature Toggles
    const [isGroupTransaction, setIsGroupTransaction] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Competence Logic
    const [competenceDate, setCompetenceDate] = useState(formatLocalDate(new Date()));
    const [isCompetenceManual, setIsCompetenceManual] = useState(false);

    useEffect(() => {
        if (isCompetenceManual || !user || profiles.length === 0) return;
        const myProfile = profiles.find(p => p.user_id === user.id);
        const startDay = myProfile?.financial_start_day || 1;
        if (!date) return;

        const [year, month, day] = date.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day);

        if (startDay > 1 && day >= startDay) {
            targetDate.setMonth(targetDate.getMonth() + 1);
            targetDate.setDate(1);
        } else {
            targetDate.setDate(1);
        }

        // Format YYYY-MM-DD
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        setCompetenceDate(`${y}-${m}-${d}`);
    }, [date, user, profiles, isCompetenceManual]);

    // Selectors
    const [card, setCard] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [payerId, setPayerId] = useState('');

    const [installments, setInstallments] = useState(1);
    const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);

    // Validation State
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Group Logic
    const [groupMembers, setGroupMembers] = useState([]);
    const [selectedProfiles, setSelectedProfiles] = useState([]);
    const [splitMode, setSplitMode] = useState('equal'); // 'equal' | 'custom'
    const [customShares, setCustomShares] = useState({}); // { [profileId]: string }

    // Init Logic
    useEffect(() => {
        if (user && profiles.length > 0 && !payerId) {
            const myProfile = profiles.find(p => p.user_id === user.id);
            if (myProfile) setPayerId(myProfile.id);
        }
    }, [user, profiles, payerId]);

    useEffect(() => {
        if (type === 'bill') {
            setIsRecurring(true);
            setInstallments(1);
        } else {
            // Reset for other types to prevent accidental recurrence (e.g. Investment becoming 12 months)
            setIsRecurring(false);
            setInstallments(1);
        }
    }, [type]);

    // Load Group Members when Group Selected
    useEffect(() => {
        if (selectedGroupId) {
            getGroupMembers(selectedGroupId).then(members => {
                console.log("Fetched Members:", members); // Debug
                setGroupMembers(members);
                // Default: All selected
                setSelectedProfiles(members.map(m => ({ ...m, isSelected: true })));
                // Default Payer: Me
                const meInGroup = members.find(m => m.user_id === user.id);
                if (meInGroup) setPayerId(meInGroup.id);
                else if (members.length > 0) setPayerId(members[0].id);
            });
        }
    }, [selectedGroupId]);

    const getThemeColor = (t = type) => {
        switch (t) {
            case 'expense': return '#FF3B30';
            case 'income': return '#34C759';
            case 'investment': return '#007AFF';
            case 'bill': return '#FF9500';
            default: return 'var(--primary)';
        }
    };

    const getBgColor = (t = type) => {
        return getThemeColor(t) + '20';
    };

    // Card Default Logic
    useEffect(() => {
        if (type === 'expense' && cards.length > 0 && !card) {
            setCard(cards[0].id);
        }
    }, [type, cards, card]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validação
        const validation = validateAll({
            amount: validateAmount(amount),
            description: validateDescription(description),
            date: validateDate(date)
        });

        setErrors(validation.errors);
        setTouched({ amount: true, description: true, date: true });

        if (!validation.valid) {
            return;
        }

        try {
            setIsSaving(true);
            const numericAmount = parseFloat(amount.replace(',', '.') || '0');

            // Logic: 
            // - If Recurring (Subscription): Generate 12 months ahead (default), Amount is full per month.
            // - If Installments: Generate N months, Amount is Total/N.
            // - Single: 1 month, Amount is Total.

            let numInstallments = 1;
            if (isRecurring) {
                numInstallments = 12; // Default subscription horizon
            } else if (type === 'expense' && installments > 1) {
                numInstallments = parseInt(installments);
            }

            const installmentAmount = (type === 'expense' && !isRecurring && numInstallments > 1)
                ? (numericAmount / numInstallments)
                : numericAmount;

            const newSeriesId = (numInstallments > 1 || isRecurring) ? crypto.randomUUID() : null;
            const transactionsBatch = [];
            const groupIdToUse = isGroupTransaction ? selectedGroupId : null;

            // Parse date string directly - NO Date object for first transaction
            // Input format is YYYY-MM-DD from HTML date input
            const dateParts = date.split('-');
            const baseYear = parseInt(dateParts[0], 10);
            const baseMonth = parseInt(dateParts[1], 10); // 1-12
            const baseDay = parseInt(dateParts[2], 10);

            // Helper to format with padding
            const pad = (n) => String(n).padStart(2, '0');

            // Helper to add months to a date (returns YYYY-MM-DD string)
            const addMonthsToDate = (y, m, d, monthsToAdd) => {
                // Simple month arithmetic
                let newMonth = m + monthsToAdd;
                let newYear = y;
                while (newMonth > 12) {
                    newMonth -= 12;
                    newYear++;
                }
                while (newMonth < 1) {
                    newMonth += 12;
                    newYear--;
                }
                return { year: newYear, month: newMonth, day: d };
            };

            for (let i = 0; i < numInstallments; i++) {
                // Calculate date for this installment
                const { year: txYear, month: txMonth, day: txDay } = addMonthsToDate(baseYear, baseMonth, baseDay, i);
                const txDateStr = `${txYear}-${pad(txMonth)}-${pad(txDay)}`;

                let invoiceDate = null;
                if (type === 'expense' && card) {
                    const selectedCard = cards.find(c => c.id === card);
                    if (selectedCard && selectedCard.closing_day) {
                        // Regra: dia < fechamento → fatura do mês atual
                        //        dia >= fechamento → fatura do mês seguinte
                        let invMonth = txMonth;
                        let invYear = txYear;
                        if (txDay >= selectedCard.closing_day) {
                            invMonth++;
                            if (invMonth > 12) { invMonth = 1; invYear++; }
                        }
                        invoiceDate = `${invYear}-${pad(invMonth)}-01`;
                    }
                }

                let sharesData = [];
                if (isGroupTransaction && selectedGroupId) {
                    const activeMembers = selectedProfiles.filter(p => p.isSelected);
                    const count = activeMembers.length;
                    if (count > 0) {
                        let sharesCalculated = [];
                        if (splitMode === 'custom') {
                            sharesCalculated = activeMembers.map(m => {
                                const rawVal = customShares[m.id];
                                let val = 0;
                                if (rawVal) val = parseFloat(rawVal.replace(',', '.') || '0');

                                // For installments, we divide the TOTAL custom amount by installments?
                                // User Agreement: "input amounts will be treated as the Total Share... divide this amount by numInstallments"
                                const valPerInstallment = isRecurring ? val : (val / numInstallments); // If recurring, it's that amount EVERY month. If installments, split it.

                                return {
                                    profile_id: m.id,
                                    share_amount: valPerInstallment,
                                    paid: m.id === payerId
                                };
                            });
                        } else {
                            const splitVal = installmentAmount / count;
                            sharesCalculated = activeMembers.map(m => ({
                                profile_id: m.id,
                                share_amount: splitVal,
                                paid: m.id === payerId
                            }));
                        }
                        sharesData = sharesCalculated;
                    }
                }

                // Get Category Name
                const selectedCategoryObj = categories.find(c => c.id === selectedCategoryId);
                const categoryName = selectedCategoryObj ? selectedCategoryObj.name : (type === 'bill' ? 'Conta' : 'Geral');

                // Calculate Competence Date for THIS specific installment/recurrence
                let itemCompetenceDate = null;
                const myProfile = profiles.find(p => p.user_id === user?.id);
                if (myProfile) {
                    const sDay = myProfile.financial_start_day || 1;
                    // Use the date of this specific installment (txDateStr)
                    const [tY, tM, tD] = txDateStr.split('-').map(Number);
                    const tDateObj = new Date(tY, tM - 1, tD);

                    if (sDay > 1 && tD >= sDay) {
                        tDateObj.setMonth(tDateObj.getMonth() + 1);
                        tDateObj.setDate(1);
                    } else {
                        tDateObj.setDate(1);
                    }
                    const cy = tDateObj.getFullYear();
                    const cm = String(tDateObj.getMonth() + 1).padStart(2, '0');
                    const cd = String(tDateObj.getDate()).padStart(2, '0');
                    itemCompetenceDate = `${cy}-${cm}-${cd}`;
                }

                transactionsBatch.push({
                    amount: installmentAmount,
                    description: description + ((numInstallments > 1 && !isRecurring) ? ` (${i + 1}/${numInstallments})` : ''),
                    date: txDateStr,
                    invoice_date: invoiceDate,
                    payer_id: payerId,
                    card_id: (type === 'expense') ? card : null,
                    category: categoryName,
                    category_id: selectedCategoryId || null,
                    type: type,
                    shares: sharesData,
                    series_id: newSeriesId,
                    group_id: groupIdToUse,
                    competence_date: itemCompetenceDate || competenceDate // Fallback if calc fails, but calc should work
                });
            }

            console.warn('DEBUG: Saving Batch', {
                count: transactionsBatch.length,
                seriesId: newSeriesId,
                firstDate: transactionsBatch[0]?.date,
                firstInvoice: transactionsBatch[0]?.invoice_date,
                isRecurring,
                numInstallments
            });

            await addTransactionsBulk(transactionsBatch);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Check mobile
    const isMobileModal = typeof window !== 'undefined' && window.innerWidth <= 480;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: isMobileModal ? 'flex-end' : 'center', justifyContent: 'center',
            padding: isMobileModal ? '0' : '20px'
        }}>
            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #E5E5EA; border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #D1D1D6; }
            `}</style>

            <div style={{ position: 'relative', width: '100%', maxWidth: isMobileModal ? '100%' : '480px' }}>

                {/* Card */}
                <div className="card animate-fade-in custom-scroll" style={{
                    width: '100%',
                    background: 'var(--bg-card)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    borderRadius: isMobileModal ? '24px 24px 0 0' : '24px',
                    padding: isMobileModal ? '20px 16px 32px' : '32px',
                    position: 'relative',
                    maxHeight: isMobileModal ? '90vh' : '85vh',
                    overflowY: 'auto'
                }}>
                    {/* Close Button - Inside Modal */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            right: '16px',
                            top: '16px',
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            zIndex: 20
                        }}
                    >
                        <X size={20} />
                    </button>

                    <h2 style={{ fontSize: isMobileModal ? '1.1rem' : '1.25rem', fontWeight: '700', marginBottom: '24px', textAlign: 'center', paddingRight: '40px' }}>Nova Movimentação</h2>

                    {/* Segmented Control */}
                    <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '4px',
                        borderRadius: '12px',
                        display: 'flex',
                        marginBottom: '32px'
                    }}>
                        {['expense', 'income', 'bill', 'investment'].map(t => {
                            const isActive = type === t;
                            const labels = { expense: 'Despesa', income: 'Receita', bill: 'Conta', investment: 'Investir' };
                            return (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: isActive ? '#FFFFFF' : 'transparent',
                                        color: isActive ? getThemeColor(t) : 'var(--text-secondary)',
                                        fontWeight: isActive ? '600' : '500',
                                        fontSize: '0.9rem',
                                        boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
                                    }}
                                >
                                    {labels[t]}
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Amount - Centered Everything */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.85rem', color: touched.amount && errors.amount ? '#FF3B30' : 'var(--text-secondary)', fontWeight: '500', marginBottom: '8px' }}>Valor</label>

                            {/* Centered Wrapper */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%',
                                padding: '8px 16px', borderRadius: '12px',
                                border: touched.amount && errors.amount ? '2px solid #FF3B30' : '2px solid transparent',
                                background: touched.amount && errors.amount ? 'rgba(255, 59, 48, 0.05)' : 'transparent'
                            }}>
                                <span style={{ fontSize: isMobileModal ? '1.5rem' : '2rem', fontWeight: '600', color: getThemeColor(), lineHeight: 1 }}>R$</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value.replace(/[^0-9.,]/g, ''));
                                        if (errors.amount) setErrors(prev => ({ ...prev, amount: null }));
                                    }}
                                    onBlur={() => setTouched(prev => ({ ...prev, amount: true }))}
                                    placeholder="0,00"
                                    autoFocus
                                    style={{
                                        fontSize: isMobileModal ? '2rem' : '2.5rem', fontWeight: '700',
                                        border: 'none', background: 'transparent',
                                        width: isMobileModal ? '140px' : '180px',
                                        textAlign: 'center',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        padding: 0
                                    }}
                                />
                            </div>
                            {touched.amount && errors.amount && (
                                <span style={{ color: '#FF3B30', fontSize: '0.75rem', marginTop: '6px', fontWeight: '500' }}>{errors.amount}</span>
                            )}
                        </div>

                        {/* Category Selector */}
                        <div style={{ padding: '0 8px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Categoria</label>
                            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', alignItems: 'flex-start' }}>

                                {/* Add Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingCategory(true)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                        minWidth: '56px'
                                    }}
                                >
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '16px',
                                        background: 'var(--bg-secondary)', border: '2px dashed var(--border)',
                                        color: 'var(--primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Plus size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Nova</span>
                                </button>

                                {availableCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                            background: 'transparent', border: 'none', cursor: 'pointer',
                                            opacity: selectedCategoryId === cat.id ? 1 : 0.5,
                                            transform: selectedCategoryId === cat.id ? 'scale(1.1)' : 'scale(1)',
                                            transition: 'all 0.2s',
                                            minWidth: '56px'
                                        }}
                                    >
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '16px',
                                            background: selectedCategoryId === cat.id ? cat.color : 'var(--bg-secondary)',
                                            color: selectedCategoryId === cat.id ? '#FFF' : 'var(--text-secondary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.2rem'
                                        }}>
                                            {cat.icon}
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: selectedCategoryId === cat.id ? '700' : '500', whiteSpace: 'nowrap' }}>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description & Date */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                            <div style={{
                                background: 'var(--bg-secondary)', borderRadius: '12px', padding: '12px 16px',
                                border: touched.description && errors.description ? '2px solid #FF3B30' : '2px solid transparent'
                            }}>
                                <label style={{ fontSize: '0.75rem', color: touched.description && errors.description ? '#FF3B30' : 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Descrição</label>
                                <input
                                    value={description}
                                    onChange={e => {
                                        setDescription(e.target.value);
                                        if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                                    }}
                                    onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
                                    placeholder="Ex: Mercado..."
                                    maxLength={100}
                                    style={{ border: 'none', background: 'transparent', fontSize: '0.95rem', outline: 'none', width: '100%', padding: 0 }}
                                />
                                {touched.description && errors.description && (
                                    <span style={{ color: '#FF3B30', fontSize: '0.7rem', marginTop: '4px', display: 'block', fontWeight: '500' }}>{errors.description}</span>
                                )}
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '12px 16px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Data</label>
                                <input
                                    type="date"
                                    min="2000-01-01"
                                    max="2099-12-31"
                                    value={date}
                                    onChange={e => {
                                        const value = e.target.value;
                                        const year = parseInt(value.split('-')[0]);
                                        if (year && (year < 2000 || year > 2099)) return;
                                        setDate(value);
                                    }}
                                    style={{ border: 'none', background: 'transparent', fontSize: '0.95rem', outline: 'none', width: '100%', padding: 0, fontFamily: 'inherit' }}
                                />
                            </div>
                        </div>

                        {/* Group Toggle */}
                        {type === 'expense' && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ padding: '6px', background: 'var(--bg-secondary)', borderRadius: '8px' }}><Users size={16} color="var(--primary)" /></div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Dividir em Grupo</span>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={isGroupTransaction}
                                        onChange={(e) => setIsGroupTransaction(e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        )}

                        {/* GROUP UI (Expanded) */}
                        {isGroupTransaction && type === 'expense' && (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#F8F8FA', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                {/* Group/Payer/Members Logic Same as Before - Abbreviated for brevity if unchanged logic is huge, but I must keep it. I will keep it. */}
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'block' }}>Grupo</label>
                                    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '0 12px', height: '44px', display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
                                        <select
                                            value={selectedGroupId}
                                            onChange={e => setSelectedGroupId(e.target.value)}
                                            style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '0.9rem', outline: 'none' }}
                                        >
                                            <option value="">Selecione o Grupo...</option>
                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {selectedGroupId && (
                                    <>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'block' }}>Quem pagou?</label>
                                            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '0 12px', height: '44px', display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
                                                <select
                                                    value={payerId}
                                                    onChange={e => setPayerId(e.target.value)}
                                                    style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '0.9rem', outline: 'none' }}
                                                >
                                                    {groupMembers.map(m => (
                                                        <option key={m.id} value={m.id}>{m.full_name || m.email || 'Membro sem nome'} {m.user_id === user.id ? '(Eu)' : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <label style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Participantes</label>
                                                <button type="button" onClick={() => setSelectedProfiles(prev => prev.map(p => ({ ...p, isSelected: !prev.every(x => x.isSelected) })))} style={{ fontSize: '0.75rem', color: 'var(--primary)', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}>
                                                    {selectedProfiles.every(p => p.isSelected) ? 'Desmarcar todos' : 'Marcar todos'}
                                                </button>
                                            </div>

                                            {/* Split Mode Toggle */}
                                            <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '2px', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSplitMode('equal')}
                                                    style={{ flex: 1, padding: '4px', borderRadius: '6px', border: 'none', background: splitMode === 'equal' ? 'var(--bg-secondary)' : 'transparent', color: splitMode === 'equal' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                                                >
                                                    Igual
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSplitMode('custom')}
                                                    style={{ flex: 1, padding: '4px', borderRadius: '6px', border: 'none', background: splitMode === 'custom' ? 'var(--bg-secondary)' : 'transparent', color: splitMode === 'custom' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                                                >
                                                    Personalizado
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                                                {groupMembers.map(m => {
                                                    const isSelected = selectedProfiles.find(p => p.id === m.id)?.isSelected;
                                                    const nameDisplay = m.full_name || m.email || '?';
                                                    const initials = nameDisplay.substring(0, 2).toUpperCase();

                                                    // Custom Share Input Logic
                                                    const customValue = customShares[m.id] || '';

                                                    return (
                                                        <div key={m.id} style={{ padding: '8px 12px', borderRadius: '12px', background: 'var(--bg-card)', border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)', transition: 'all 0.2s' }}>
                                                            <div
                                                                onClick={() => { setSelectedProfiles(prev => prev.map(p => p.id === m.id ? { ...p, isSelected: !p.isSelected } : p)); }}
                                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: (isSelected && splitMode === 'custom') ? '8px' : '0' }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>{initials}</div>
                                                                    <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>{nameDisplay} {m.user_id === user.id && <span style={{ color: 'var(--text-tertiary)' }}>(Eu)</span>}</span>
                                                                </div>
                                                                <div style={{ width: 20, height: 20, borderRadius: '6px', border: isSelected ? 'none' : '2px solid var(--border)', background: isSelected ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isSelected && <Check size={14} color="#fff" />}</div>
                                                            </div>

                                                            {isSelected && splitMode === 'custom' && (
                                                                <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '44px' }}>
                                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>R$</span>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="0,00"
                                                                        value={customValue}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value.replace(/[^0-9.,]/g, '');
                                                                            setCustomShares(prev => ({ ...prev, [m.id]: val }));
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        style={{
                                                                            width: '100%', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', fontSize: '0.9rem', background: 'var(--bg-secondary)', outline: 'none'
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {groupMembers.length === 0 && <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Nenhum membro encontrado.</div>}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Card Selection */}
                        {type === 'expense' && (
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '12px 16px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Cartão de Crédito</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CreditCard size={18} color="var(--text-secondary)" />
                                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                        <select
                                            value={card}
                                            onChange={(e) => {
                                                if (e.target.value === 'new') {
                                                    setIsCardModalOpen(true);
                                                    return;
                                                }
                                                setCard(e.target.value);
                                            }}
                                            style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '0.95rem', outline: 'none' }}
                                        >
                                            {cards.length === 0 && <option value="">Nenhum cartão cadastrado</option>}
                                            {cards.length > 0 && <option value="">Selecione...</option>}
                                            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            <option value="new" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Adicionar Novo Cartão</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recurrence */}
                        {type === 'expense' && (
                            <div style={{ marginTop: '8px' }}>
                                <button type="button" onClick={() => setShowRecurrenceOptions(!showRecurrenceOptions)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: isRecurring || installments > 1 ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}>
                                    <Repeat size={16} />
                                    {isRecurring ? 'Assinatura Mensal' : (installments > 1 ? `Parcelado em ${installments}x` : 'Repetir / Parcelar')}
                                </button>
                                {showRecurrenceOptions && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                                        <button type="button" onClick={() => { setIsRecurring(false); }} style={{ padding: '6px 12px', borderRadius: '8px', background: !isRecurring ? 'var(--primary)' : 'var(--bg-secondary)', color: !isRecurring ? '#fff' : 'var(--text-secondary)', border: 'none', fontSize: '0.8rem' }}>Parcelas</button>
                                        <button type="button" onClick={() => { setIsRecurring(true); setInstallments(1); }} style={{ padding: '6px 12px', borderRadius: '8px', background: isRecurring ? 'var(--primary)' : 'var(--bg-secondary)', color: isRecurring ? '#fff' : 'var(--text-secondary)', border: 'none', fontSize: '0.8rem' }}>Recorrente</button>
                                        {!isRecurring && (
                                            <input type="number" min="2" max="24" value={installments} onChange={e => setInstallments(e.target.value)} style={{ width: '60px', padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSaving}
                            style={{
                                padding: '16px', borderRadius: '16px', background: isSaving ? '#ccc' : getThemeColor(), color: '#fff', border: 'none', fontSize: '1rem', fontWeight: '600', marginTop: '8px', cursor: isSaving ? 'not-allowed' : 'pointer', boxShadow: `0 4px 12px ${getBgColor()}`, transition: 'transform 0.1s', opacity: isSaving ? 0.7 : 1
                            }}
                            onMouseDown={e => !isSaving && (e.currentTarget.style.transform = 'scale(0.98)')}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Transação'}
                        </button>
                    </form>
                </div>
            </div>

            {isCreatingCategory && (
                <NewCategoryModal
                    type={type}
                    onSuccess={refreshCategories}
                    onClose={() => setIsCreatingCategory(false)}
                />
            )}

            {isCardModalOpen && (
                <NewCardModal
                    onClose={() => setIsCardModalOpen(false)}
                    onSuccess={(newCard) => {
                        // Handle update
                        if (newCard) {
                            // If array (from fetch) or single obj
                            const cardId = Array.isArray(newCard) ? newCard[0]?.id : newCard.id;
                            if (cardId) setCard(cardId);
                        }
                    }}
                />
            )}
        </div>
    );
}

