import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Users, Upload, Calendar, CreditCard, Repeat, Plus, Target, Search, X, Trash2, ChevronDown } from 'lucide-react';
import { useTransactionForm } from './hooks/useTransactionForm';
import { useTransactions } from '../../hooks/useTransactions';
import { useCards } from '../../hooks/useCards';
import { useGroups } from '../../hooks/useGroups';
import { useCategories } from '../../hooks/useCategories';
import { useGoals } from '../../hooks/useGoals';
import { useProfiles } from '../../hooks/useProfiles';
import { useIsMobile } from '../../hooks/useIsMobile';
import NewCategoryModal from '../categories/NewCategoryModal';
import NewCardModal from '../cards/NewCardModal';
import SeriesActionModal from '../../components/SeriesActionModal';
import { hapticFeedback } from '../../utils/haptic';
import { supabase } from '../../supabaseClient';

export default function AddTransactionView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isMobile = useIsMobile();
    const { transactions, fetchTransactions, removeTransactionSeries } = useTransactions();

    // Find initial data if editing
    const editingTx = transactions?.find(t => t.id === id);

    const {
        type, setType,
        amount, setAmount,
        description, setDescription,
        date, setDate,
        selectedCategoryId, setSelectedCategoryId,
        selectedGoalId, setSelectedGoalId,
        cardId, setCardId,
        payerId, setPayerId,
        isRecurring, setIsRecurring,
        installments, setInstallments,
        isGroupTransaction, setIsGroupTransaction,
        selectedGroupId, setSelectedGroupId,
        splitMode, setSplitMode,
        selectedProfiles, setSelectedProfiles,
        customShares, setCustomShares,
        competenceDate, setCompetenceDate,
        isSaving,
        errors,
        touched,
        save,
        handleAmountChange,
        placeholder
    } = useTransactionForm({
        onSaveSuccess: () => navigate(-1),
        initialData: editingTx
    });

    const { cards } = useCards();
    const { groups } = useGroups();
    const { categories, refreshCategories } = useCategories();
    const { goals } = useGoals();
    const { profiles, addProfile } = useProfiles();

    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [showEditChoice, setShowEditChoice] = useState(false);
    const [showDeleteChoice, setShowDeleteChoice] = useState(false);
    const [participantSearch, setParticipantSearch] = useState('');
    const [isSearchingExternal, setIsSearchingExternal] = useState(false);
    const [file, setFile] = useState(null);
    const availableCategories = categories.filter(c => c.type === type);

    // Listen for floating calculator value (desktop)
    useEffect(() => {
        const handleCalcValue = (e) => {
            setAmount(e.detail.value);
        };
        window.addEventListener('calculator:use-value', handleCalcValue);
        return () => window.removeEventListener('calculator:use-value', handleCalcValue);
    }, [setAmount]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleAction = async (e) => {
        e.preventDefault();
        if (editingTx?.series_id) {
            setShowEditChoice(true);
        } else {
            await save('single');
        }
    };

    const getThemeColor = (t = type) => {
        switch (t) {
            case 'expense': return '#FF3B30';
            case 'income': return '#34C759';
            case 'investment': return '#007AFF';
            case 'bill': return '#FF9500';
            default: return 'var(--primary)';
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '120px', maxWidth: '680px', margin: '0 auto', padding: isMobile ? '0 16px' : '40px 20px', animation: 'fadeIn 0.3s ease' }}>
            {/* Header Premium */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px',
                marginTop: isMobile ? 'calc(16px + env(safe-area-inset-top, 0px))' : '0'
            }}>
                <button onClick={() => navigate(-1)} style={{ width: 44, height: 44, borderRadius: '16px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: '1px solid var(--border-light)', cursor: 'pointer', transition: '0.2s' }} className="hover:scale-105 active:scale-95">
                    <ArrowLeft size={22} />
                </button>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '850', color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>
                        {editingTx ? 'Editar Registro' : 'Novo Registro'}
                    </h1>
                </div>
                {editingTx ? (
                    <button
                        onClick={() => editingTx.series_id ? setShowDeleteChoice(true) : (window.confirm('Excluir?') && supabase.from('transactions').delete().eq('id', id).then(() => navigate(-1)))}
                        style={{ width: 44, height: 44, borderRadius: '16px', background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3B30', border: '1px solid #FFE0E0', cursor: 'pointer', transition: '0.2s' }}
                        className="hover:scale-105 active:scale-95"
                    >
                        <Trash2 size={20} />
                    </button>
                ) : <div style={{ width: 44 }} />}
            </header>

            <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* Tipo de Transação */}
                <div style={{ background: 'var(--bg-secondary)', padding: '6px', borderRadius: '20px', display: 'flex' }}>
                    {['expense', 'income', 'bill', 'investment'].map(t => (
                        <button
                            key={t} type="button" onClick={() => {
                                setType(t);
                                hapticFeedback('light');
                            }}
                            style={{
                                flex: 1, padding: '12px 0', borderRadius: '16px', border: 'none',
                                background: type === t ? '#FFFFFF' : 'transparent',
                                boxShadow: type === t ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                                color: type === t ? getThemeColor(t) : 'var(--text-secondary)',
                                fontWeight: type === t ? '800' : '650', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            {{ expense: 'Despesa', income: 'Receita', bill: 'Conta', investment: 'Investir' }[t]}
                        </button>
                    ))}
                </div>

                {/* Valor e Descrição (Hero) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: '850', color: getThemeColor(), opacity: 0.9, transform: 'translateY(-2px)' }}>R$</span>
                        <input
                            type="text" inputMode="numeric" value={amount}
                            onChange={handleAmountChange}
                            placeholder="0,00"
                            style={{
                                fontSize: isMobile ? '3.5rem' : '4.5rem',
                                fontWeight: '950',
                                color: 'var(--text-primary)',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                width: isMobile ? '180px' : '260px',
                                textAlign: 'center',
                                letterSpacing: '-2px',
                                caretColor: getThemeColor()
                            }}
                        />
                    </div>
                </div>

                {/* Card Principal: Informações Base */}
                <div className="card" style={{ padding: '0', borderRadius: '28px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>

                    {/* Linha Descrição (PROMINENTE) */}
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>Título / Descrição</label>
                        <input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={placeholder}
                            style={{
                                width: '100%',
                                background: 'var(--bg-secondary)',
                                border: '1px solid transparent',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                outline: 'none',
                                color: 'var(--text-primary)',
                                padding: '16px 20px',
                                borderRadius: '16px',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={e => {
                                e.target.style.background = 'var(--bg-card)';
                                e.target.style.borderColor = getThemeColor();
                                e.target.style.boxShadow = `0 0 0 3px ${getThemeColor()}20`;
                            }}
                            onBlur={e => {
                                e.target.style.background = 'var(--bg-secondary)';
                                e.target.style.borderColor = 'transparent';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Linha Data */}
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)', display: 'block', marginBottom: '12px' }}>Quando aconteceu?</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <div style={{ position: 'absolute', left: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                                <Calendar size={20} color="var(--primary)" />
                            </div>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid transparent',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    outline: 'none',
                                    color: 'var(--text-primary)',
                                    padding: '16px 16px 16px 48px',
                                    borderRadius: '16px',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onFocus={e => {
                                    e.target.style.background = 'var(--bg-card)';
                                    e.target.style.borderColor = getThemeColor();
                                    e.target.style.boxShadow = `0 0 0 3px ${getThemeColor()}20`;
                                }}
                                onBlur={e => {
                                    e.target.style.background = 'var(--bg-secondary)';
                                    e.target.style.borderColor = 'transparent';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    {/* Linha Conta (apenas despesa) */}
                    {type === 'expense' && (
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)', display: 'block', marginBottom: '12px' }}>Como você pagou?</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <div style={{ position: 'absolute', left: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                                    <CreditCard size={20} color="var(--primary)" />
                                </div>
                                <select
                                    value={cardId}
                                    onChange={e => setCardId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid transparent',
                                        fontSize: '1rem',
                                        fontWeight: '700',
                                        outline: 'none',
                                        color: 'var(--text-primary)',
                                        padding: '16px 48px 16px 48px',
                                        borderRadius: '16px',
                                        appearance: 'none',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onFocus={e => {
                                        e.target.style.background = 'var(--bg-card)';
                                        e.target.style.borderColor = getThemeColor();
                                        e.target.style.boxShadow = `0 0 0 3px ${getThemeColor()}20`;
                                    }}
                                    onBlur={e => {
                                        e.target.style.background = 'var(--bg-secondary)';
                                        e.target.style.borderColor = 'transparent';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="">Carteira / Dinheiro</option>
                                    {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div style={{ position: 'absolute', right: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                                    <ChevronDown size={20} color="var(--text-tertiary)" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bloco de Categorias em Chips */}
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>Categoria</label>
                            <button type="button" onClick={() => setIsCreatingCategory(true)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Plus size={16} /> Adicionar
                            </button>
                        </div>

                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            paddingRight: '4px'
                        }} className="custom-scroll">
                            {availableCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategoryId(cat.id);
                                        hapticFeedback('light');
                                    }}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: selectedCategoryId === cat.id ? `${cat.color}15` : 'var(--bg-secondary)',
                                        padding: '10px 16px',
                                        borderRadius: '16px',
                                        border: `1.5px solid ${selectedCategoryId === cat.id ? cat.color : 'transparent'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        color: selectedCategoryId === cat.id ? cat.color : 'var(--text-secondary)',
                                        fontWeight: '750'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                                    <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Opções Avançadas: Dividir e Repetir */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Bloco Dividir Gasto */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="card" style={{ padding: '16px 20px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-light)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-primary)' }}><Users size={20} /></div>
                                <span style={{ fontSize: '1rem', fontWeight: '750' }}>Dividir Gasto</span>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={isGroupTransaction} onChange={e => {
                                    setIsGroupTransaction(e.target.checked);
                                    hapticFeedback('light');
                                }} />
                                <span className="slider"></span>
                            </label>
                        </div>

                        {isGroupTransaction && (
                            <div className="card animate-fade-in" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: '750', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Qual Grupo?</label>
                                    <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--bg-secondary)', fontWeight: '700', outline: 'none' }}>
                                        <option value="">Sem grupo</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: '750', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Como dividir?</label>
                                    <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '16px' }}>
                                        {[
                                            { id: 'equal', label: 'Em partes iguais' },
                                            { id: 'custom', label: 'Valores manuais' }
                                        ].map(mode => (
                                            <button
                                                key={mode.id} type="button" onClick={() => setSplitMode(mode.id)}
                                                style={{
                                                    flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
                                                    background: splitMode === mode.id ? '#FFF' : 'transparent',
                                                    color: splitMode === mode.id ? 'var(--primary)' : 'var(--text-secondary)',
                                                    fontWeight: '750', fontSize: '0.85rem', cursor: 'pointer',
                                                    boxShadow: splitMode === mode.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                                }}
                                            >
                                                {mode.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: '750', color: 'var(--text-secondary)' }}>Participantes</label>
                                        <button type="button" onClick={() => setSelectedProfiles(prev => prev.map(p => ({ ...p, isSelected: !prev.every(x => x.isSelected) })))} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '750', cursor: 'pointer' }}>
                                            {selectedProfiles.every(x => x.isSelected) ? 'Limpar' : 'Todos'}
                                        </button>
                                    </div>

                                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                        <input
                                            placeholder="Adicionar nome..."
                                            value={participantSearch}
                                            onChange={e => setParticipantSearch(e.target.value)}
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter' && participantSearch.trim()) {
                                                    e.preventDefault();
                                                    try {
                                                        const newProfile = await addProfile(participantSearch.trim());
                                                        if (newProfile) {
                                                            setSelectedProfiles(prev => [...prev.map(p => ({ ...p, isSelected: p.isSelected })), { ...newProfile, isSelected: true, isOwner: false }]);
                                                            setParticipantSearch('');
                                                        }
                                                    } catch (err) { alert('Erro ao criar perfil'); }
                                                }
                                            }}
                                            style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '16px', background: 'var(--bg-secondary)', border: 'none', fontSize: '0.9rem', outline: 'none', fontWeight: '600' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {selectedProfiles.map(profile => (
                                            <div key={profile.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '16px', background: profile.isSelected ? 'var(--bg-secondary)' : 'transparent', border: `1px solid ${profile.isSelected ? 'var(--border-light)' : 'transparent'}`, opacity: profile.isSelected ? 1 : 0.6, cursor: 'pointer' }} onClick={() => {
                                                setSelectedProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, isSelected: !p.isSelected } : p));
                                            }}>
                                                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: profile.isOwner ? 'var(--primary)' : '#E0E0E0', color: profile.isOwner ? '#FFF' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' }}>
                                                    {profile.name?.substring(0, 1).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: '700' }}>{profile.name} {profile.isOwner && '(Você)'}</div>
                                                </div>
                                                {splitMode === 'custom' && profile.isSelected && (
                                                    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFF', padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '750', color: 'var(--text-secondary)' }}>R$</span>
                                                        <input
                                                            value={customShares[profile.id] || ''}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/[^\d,]/g, '');
                                                                setCustomShares(prev => ({ ...prev, [profile.id]: val }));
                                                            }}
                                                            placeholder="0,00"
                                                            style={{ width: '60px', border: 'none', outline: 'none', fontSize: '0.95rem', fontWeight: '750', textAlign: 'right' }}
                                                        />
                                                    </div>
                                                )}
                                                <div style={{ width: '24px', height: '24px', borderRadius: '8px', border: `2px solid ${profile.isSelected ? 'var(--primary)' : 'var(--border)'}`, background: profile.isSelected ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {profile.isSelected && <Check size={14} color="#FFF" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bloco Recorrência */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="card" style={{ padding: '16px 20px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-light)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-primary)' }}><Repeat size={20} /></div>
                                <span style={{ fontSize: '1rem', fontWeight: '750' }}>Repetir Mensalmente</span>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={isRecurring} onChange={e => {
                                    setIsRecurring(e.target.checked);
                                    hapticFeedback('light');
                                }} />
                                <span className="slider"></span>
                            </label>
                        </div>

                        {type === 'expense' && !isRecurring && (
                            <div className="card animate-fade-in" style={{ padding: '16px 20px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-light)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-primary)' }}><Repeat size={20} /></div>
                                    <span style={{ fontSize: '1rem', fontWeight: '750' }}>Parcelar Compra</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Em</span>
                                    <input type="number" min="1" max="48" value={installments} onChange={e => setInstallments(parseInt(e.target.value))} style={{ width: '48px', border: 'none', background: 'var(--bg-secondary)', borderRadius: '10px', textAlign: 'center', fontWeight: '800', fontSize: '1rem', padding: '8px' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>x</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                    <button
                        type="submit"
                        disabled={isSaving}
                        onClick={() => hapticFeedback('medium')}
                        style={{
                            width: '100%',
                            padding: '22px',
                            borderRadius: '24px',
                            background: getThemeColor(),
                            color: '#fff',
                            border: 'none',
                            fontSize: '1.15rem',
                            fontWeight: '900',
                            cursor: 'pointer',
                            boxShadow: `0 12px 24px ${getThemeColor()}35`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px'
                        }}
                        className="hover:scale-[1.02] active:scale-[0.98] btn-shine"
                    >
                        {isSaving ? (
                            <>
                                <div className="spinner-white" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Check size={22} strokeWidth={3} />
                                {editingTx ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                            </>
                        )}
                    </button>
                </div>
            </form>

            <SeriesActionModal isOpen={showEditChoice} action="edit" onClose={() => setShowEditChoice(false)} onConfirm={save} />
            <SeriesActionModal isOpen={showDeleteChoice} action="delete" onClose={() => setShowDeleteChoice(false)} onConfirm={(scope) => removeTransactionSeries(id, editingTx.series_id, scope).then(() => navigate(-1))} />
            {isCreatingCategory && <NewCategoryModal type={type} onClose={() => setIsCreatingCategory(false)} onCreated={refreshCategories} />}
        </div>
    );
}


