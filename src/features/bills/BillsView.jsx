import React, { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useProfiles } from '../../hooks/useProfiles';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, X, Search, Check, Trash2, Calendar, ChevronDown, ChevronUp, AlertCircle, DollarSign, Repeat } from 'lucide-react';
import { validateAmount, validateDescription, validateDate, validateAll } from '../../utils/validation';
import { useDashboard } from '../../contexts/DashboardContext';

export default function BillsView() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isAddMode = searchParams.get('mode') === 'add';

    const { selectedDate } = useDashboard();
    const { transactions, addTransaction, addTransactionsBulk, updateTransaction, removeTransaction, fetchTransactions } = useTransactions();
    const { user } = useAuth();
    const { profiles } = useProfiles();

    // State
    // const [currentDate, setCurrentDate] = useState(new Date()); // Removed in favor of global selectedDate
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedBillId, setExpandedBillId] = useState(null);
    const [showForm, setShowForm] = useState(isAddMode);

    // Form State
    const [editingBill, setEditingBill] = useState(null); // If not null, we are editing
    const [isRecurring, setIsRecurring] = useState(false); // New Toggle
    const [formData, setFormData] = useState({ description: '', amount: '', date: '' });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // -- Derived Data --
    const bills = useMemo(() => transactions.filter(t => t.type === 'bill'), [transactions]);

    // 1. Filter by Month
    const monthBills = useMemo(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();

        return bills.filter(b => {
            // Bills use simple date or might have competence date
            // Safe parsing helper:
            let billDate = new Date(b.date);
            if (typeof b.date === 'string' && !b.date.includes('T')) {
                billDate = new Date(b.date + 'T12:00:00');
            }

            return billDate.getMonth() === month && billDate.getFullYear() === year;
        });
    }, [bills, selectedDate]);

    // 2. Filter by Search (within the month)
    const filteredBills = useMemo(() => {
        return monthBills.filter(b =>
            (b.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date asc
    }, [monthBills, searchTerm]);

    // 3. Stats (based on Month)
    const summary = useMemo(() => {
        const targetList = monthBills;

        const total = targetList.reduce((sum, b) => sum + b.amount, 0);
        const paid = targetList.filter(b => b.category === 'paid').reduce((sum, b) => sum + b.amount, 0);
        const pending = total - paid;
        const progress = total === 0 ? 0 : (paid / total) * 100;
        return { total, paid, pending, progress };
    }, [monthBills]);

    // -- Handlers --

    // Auto-fill date from context when opening form in Add Mode
    useEffect(() => {
        if (showForm && !editingBill) {
            const y = selectedDate.getFullYear();
            const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const d = String(selectedDate.getDate()).padStart(2, '0');
            setFormData(prev => ({ ...prev, date: `${y}-${m}-${d}` }));
            setIsRecurring(false);
        }
    }, [showForm, editingBill, selectedDate]);

    useEffect(() => {
        if (isAddMode) {
            setShowForm(true);
            setEditingBill(null);
            // Don't reset date here to empty, let specific effect handle it
            setFormData(prev => ({ ...prev, description: '', amount: '' }));
        }
    }, [isAddMode]);

    // Navigation handlers removed

    const togglePaid = async (e, bill) => {
        e.stopPropagation();
        const newStatus = bill.category === 'paid' ? 'pending' : 'paid';
        try {
            await updateTransaction(bill.id, { ...bill, category: newStatus });
            // fetchTransactions(); // Context handles this
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Excluir esta conta permanentemente?')) {
            await removeTransaction(id);
            if (expandedBillId === id) setExpandedBillId(null);
        }
    };

    const handleEdit = (bill) => {
        setEditingBill(bill);
        setFormData({
            description: bill.description,
            amount: bill.amount.toString().replace('.', ','),
            date: bill.date.split('T')[0] // Ensure YYYY-MM-DD
        });
        setErrors({});
        setTouched({});
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingBill(null);
        setFormData({ description: '', amount: '', date: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Validação
        const validation = validateAll({
            description: validateDescription(formData.description),
            amount: validateAmount(formData.amount),
            date: validateDate(formData.date)
        });

        setErrors(validation.errors);
        setTouched({ description: true, amount: true, date: true });

        if (!validation.valid) return;

        try {
            const myProfile = profiles.find(p => p.user_id === user?.id);
            if (!myProfile) return alert('Perfil não encontrado');

            // Generate Batch
            const numInstallments = isRecurring && !editingBill ? 12 : 1;
            const newSeriesId = numInstallments > 1 ? crypto.randomUUID() : null;

            // Base Date
            const [baseY, baseM, baseD] = formData.date.split('-').map(Number);
            const baseAmount = parseFloat(formData.amount.replace('.', '').replace(',', '.'));

            const batch = [];

            for (let i = 0; i < numInstallments; i++) {
                // Calculate Date: Add 'i' months
                const d = new Date(baseY, baseM - 1 + i, baseD);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dayStr = String(d.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${dayStr}`;

                // Calculate Competence Date
                let competenceDate = null;
                const sDay = myProfile.financial_start_day || 1;

                // For competence, we check the specific date of this installment
                const compDateObj = new Date(y, d.getMonth(), parseInt(dayStr));
                if (sDay > 1 && parseInt(dayStr) >= sDay) {
                    compDateObj.setMonth(compDateObj.getMonth() + 1);
                }
                compDateObj.setDate(1); // Set to 1st
                const cy = compDateObj.getFullYear();
                const cm = String(compDateObj.getMonth() + 1).padStart(2, '0');
                competenceDate = `${cy}-${cm}-01`;

                batch.push({
                    description: formData.description.trim(),
                    amount: baseAmount,
                    date: dateStr,
                    payer_id: myProfile.id,
                    type: 'bill',
                    category: editingBill ? editingBill.category : 'pending',
                    series_id: newSeriesId,
                    competence_date: competenceDate
                });
            }

            if (editingBill) {
                // Determine series update vs single update? 
                // For now, simplify: standard update single
                await updateTransaction(editingBill.id, batch[0]);
                alert('Conta atualizada!');
            } else {
                if (batch.length === 1) {
                    await addTransaction(batch[0]);
                } else {
                    await addTransactionsBulk(batch);
                }
            }

            handleCloseForm();
            // fetchTransactions(true); // Context handles this
            if (isAddMode) navigate('/bills');
        } catch (err) {
            alert('Erro ao salvar: ' + err.message + (err.details ? JSON.stringify(err.details) : ''));
            console.error(err);
        }
    };

    // -- Styles --
    const inputContainerStyle = {
        background: '#F2F2F7', // Apple Light Gray
        borderRadius: '12px',
        padding: '12px 16px',
        border: '1px solid transparent', // Ready for focus state
        transition: 'all 0.2s'
    };

    const inputStyle = {
        width: '100%', background: 'transparent', border: 'none',
        fontSize: '1rem', fontWeight: '500', outline: 'none',
        color: 'var(--text-primary)', fontFamily: 'inherit'
    };

    const labelStyle = {
        fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px', display: 'block', marginLeft: '4px'
    };

    const currentMonthLabel = selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // -- Components --

    const SummaryCard = ({ label, value, color, icon: Icon }) => (
        <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
                <Icon size={14} /> {label.toUpperCase()}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: color }}>
                R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
        </div>
    );

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '100px', marginTop: '24px' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {showForm && (
                        <button onClick={handleCloseForm} style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                        {showForm ? (editingBill ? 'Editar Conta' : 'Nova Conta') : 'Contas'}
                    </h1>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        style={{
                            background: 'var(--text-primary)', color: '#FFF', border: 'none',
                            padding: '10px 20px', borderRadius: '24px', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                    >
                        <Plus size={18} />
                        <span style={{ fontSize: '0.9rem' }}>Nova Conta</span>
                    </button>
                )}
            </header>

            {/* Main Content (when not in form) */}
            {!showForm && (
                <div className="animate-slide-up">

                    {/* Month Navigator REMOVED in favor of Global Date */}

                    {/* Summary Section */}
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                            <SummaryCard label="Total" value={summary.total} color="var(--text-primary)" icon={DollarSign} />
                            <SummaryCard label="Pago" value={summary.paid} color="var(--success)" icon={Check} />
                            <SummaryCard label="Pendente" value={summary.pending} color="var(--warning)" icon={AlertCircle} />
                        </div>
                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${summary.progress}%`, height: '100%', background: 'var(--success)', transition: 'width 0.5s ease' }} />
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            {summary.progress.toFixed(0)}% pago este mês
                        </div>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar conta..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px 12px 48px',
                                borderRadius: '20px',
                                background: 'var(--bg-secondary)',
                                border: 'none',
                                fontSize: '0.95rem',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Bills List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredBills.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                <p>Nenhuma conta para {currentMonthLabel}.</p>
                            </div>
                        ) : (
                            filteredBills.map(bill => {
                                const isPaid = bill.category === 'paid';
                                const isExpanded = expandedBillId === bill.id;

                                return (
                                    <div
                                        key={bill.id}
                                        onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                                        style={{
                                            background: 'var(--bg-card)',
                                            borderRadius: '20px',
                                            border: '1px solid var(--border)',
                                            overflow: 'hidden',
                                            transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            cursor: 'pointer',
                                            boxShadow: isExpanded ? '0 8px 24px rgba(0,0,0,0.08)' : 'none',
                                            transform: isExpanded ? 'scale(1.01)' : 'scale(1)',
                                            position: 'relative' // For absolute edit button if needed
                                        }}
                                    >
                                        {/* Main Row */}
                                        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            {/* Checkbox */}
                                            <div
                                                onClick={(e) => togglePaid(e, bill)}
                                                style={{
                                                    width: '24px', height: '24px',
                                                    borderRadius: '50%',
                                                    border: isPaid ? 'none' : '2px solid var(--border)',
                                                    background: isPaid ? 'var(--success)' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#FFF', flexShrink: 0,
                                                    transition: 'all 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {isPaid && <Check size={14} strokeWidth={3} />}
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, opacity: isPaid ? 0.5 : 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)', textDecoration: isPaid ? 'line-through' : 'none' }}>
                                                    {bill.description}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    Vence dia {new Date(bill.date + 'T12:00:00').getDate()}
                                                </div>
                                            </div>

                                            {/* Amount & Arrow */}
                                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ fontWeight: '700', fontSize: '1rem', color: isPaid ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                                                    R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                                <div style={{ color: 'var(--text-tertiary)', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                                                    <ChevronDown size={18} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Actions */}
                                        {isExpanded && (
                                            <div style={{
                                                background: 'var(--bg-secondary)',
                                                padding: '12px 16px',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                borderTop: '1px solid var(--border)'
                                            }}>
                                                <div style={{ fontSize: '0.8rem', color: isPaid ? 'var(--success)' : 'var(--warning)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {isPaid ? <><Check size={14} /> PAGO</> : <><AlertCircle size={14} /> PENDENTE</>}
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(bill); }}
                                                        style={{
                                                            background: 'rgba(0, 122, 255, 0.1)', color: 'var(--primary)',
                                                            border: 'none', padding: '8px 16px', borderRadius: '12px',
                                                            fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '6px'
                                                        }}
                                                    >
                                                        <DollarSign size={14} /> Editar
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(bill.id); }}
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                                                            border: 'none', padding: '8px 16px', borderRadius: '12px',
                                                            fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '6px'
                                                        }}
                                                    >
                                                        <Trash2 size={14} /> Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ADD/EDIT FORM */}
            {showForm && (
                <div className="card animate-scale-in" style={{ padding: '32px', borderRadius: '24px', marginBottom: '24px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '24px', fontSize: '1.4rem', fontWeight: '700' }}>
                        {editingBill ? 'Editar Conta' : 'Nova Conta'}
                    </h3>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ ...labelStyle, color: touched.description && errors.description ? '#FF3B30' : 'var(--text-secondary)' }}>Descrição</label>
                            <div style={{ ...inputContainerStyle, border: touched.description && errors.description ? '2px solid #FF3B30' : '1px solid transparent' }}>
                                <input
                                    style={inputStyle}
                                    value={formData.description}
                                    onChange={e => {
                                        setFormData({ ...formData, description: e.target.value });
                                        if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                                    }}
                                    onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
                                    placeholder="Ex: Aluguel, Luz..."
                                    maxLength={100}
                                    autoFocus
                                />
                            </div>
                            {touched.description && errors.description && (
                                <span style={{ color: '#FF3B30', fontSize: '0.75rem', marginTop: '4px', marginLeft: '4px', display: 'block', fontWeight: '500' }}>{errors.description}</span>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ ...labelStyle, color: touched.amount && errors.amount ? '#FF3B30' : 'var(--text-secondary)' }}>Valor</label>
                                <div style={{ ...inputContainerStyle, border: touched.amount && errors.amount ? '2px solid #FF3B30' : '1px solid transparent' }}>
                                    <input
                                        style={inputStyle}
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.amount}
                                        onChange={e => {
                                            setFormData({ ...formData, amount: e.target.value.replace(/[^0-9.,]/g, '') });
                                            if (errors.amount) setErrors(prev => ({ ...prev, amount: null }));
                                        }}
                                        onBlur={() => setTouched(prev => ({ ...prev, amount: true }))}
                                        placeholder="0,00"
                                    />
                                </div>
                                {touched.amount && errors.amount && (
                                    <span style={{ color: '#FF3B30', fontSize: '0.75rem', marginTop: '4px', marginLeft: '4px', display: 'block', fontWeight: '500' }}>{errors.amount}</span>
                                )}
                            </div>
                            <div>
                                <label style={{ ...labelStyle, color: touched.date && errors.date ? '#FF3B30' : 'var(--text-secondary)' }}>Vencimento</label>
                                <div style={{ ...inputContainerStyle, border: touched.date && errors.date ? '2px solid #FF3B30' : '1px solid transparent' }}>
                                    <input
                                        style={inputStyle} type="date"
                                        min="2000-01-01"
                                        max="2099-12-31"
                                        value={formData.date}
                                        onChange={e => {
                                            setFormData({ ...formData, date: e.target.value });
                                            if (errors.date) setErrors(prev => ({ ...prev, date: null }));
                                        }}
                                        onBlur={() => setTouched(prev => ({ ...prev, date: true }))}
                                    />
                                </div>
                                {touched.date && errors.date && (
                                    <span style={{ color: '#FF3B30', fontSize: '0.75rem', marginTop: '4px', marginLeft: '4px', display: 'block', fontWeight: '500' }}>{errors.date}</span>
                                )}
                            </div>
                        </div>

                        {!editingBill && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsRecurring(!isRecurring)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        background: isRecurring ? 'rgba(81, 0, 255, 0.1)' : 'transparent',
                                        border: isRecurring ? '1px solid var(--primary)' : '1px solid var(--border)',
                                        padding: '10px 16px', borderRadius: '12px',
                                        color: isRecurring ? 'var(--primary)' : 'var(--text-secondary)',
                                        cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Repeat size={16} />
                                    Repetir por 12 meses (Fixo)
                                </button>
                            </div>
                        )}
                        <button type="submit" className="btn" style={{
                            marginTop: '12px', padding: '16px', fontSize: '1rem', fontWeight: '700', borderRadius: '16px',
                            background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer',
                            boxShadow: '0 8px 20px rgba(81, 0, 255, 0.25)'
                        }}>
                            {editingBill ? 'Salvar Alterações' : 'Salvar Conta'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
