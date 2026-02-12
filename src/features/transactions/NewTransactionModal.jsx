import React, { useState, useEffect } from 'react';
import { X, Users, CreditCard, Repeat, Check, Calendar, Plus, Upload, Target, Search } from 'lucide-react';
import { useTransactionForm } from './hooks/useTransactionForm';
import { useCards } from '../../hooks/useCards';
import { useGroups } from '../../hooks/useGroups';
import { useCategories } from '../../hooks/useCategories';
import { useGoals } from '../../hooks/useGoals';
import { useProfiles } from '../../hooks/useProfiles';
import NewCategoryModal from '../categories/NewCategoryModal';
import NewCardModal from '../cards/NewCardModal';
import { hapticFeedback } from '../../utils/haptic';

export default function NewTransactionModal({ onClose, onSuccess, initialType = 'expense' }) {
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
        isCompetenceManual, setIsCompetenceManual,
        isSaving,
        errors,
        touched,
        setTouched,
        save,
        handleAmountChange,
        placeholder
    } = useTransactionForm({ onSaveSuccess: () => { onSuccess?.(); onClose(); }, initialType });

    const { cards } = useCards();
    const { groups } = useGroups();
    const { categories } = useCategories();
    const { goals } = useGoals();

    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [participantSearch, setParticipantSearch] = useState('');
    const { addProfile } = useProfiles();
    const [file, setFile] = useState(null);

    const availableCategories = categories.filter(c => c.type === type);

    const getThemeColor = (t = type) => {
        switch (t) {
            case 'expense': return '#FF3B30';
            case 'income': return '#34C759';
            case 'investment': return '#007AFF';
            case 'bill': return '#FF9500';
            default: return 'var(--primary)';
        }
    };

    const isMobileModal = typeof window !== 'undefined' && window.innerWidth <= 480;

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: isMobileModal ? 'flex-end' : 'center', justifyContent: 'center',
                cursor: 'pointer'
            }}
        >
            {/* Safety Margin Wrapper: Clicks within this padding won't close the modal */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    padding: isMobileModal ? '0' : '40px',
                    display: 'flex',
                    alignItems: isMobileModal ? 'flex-end' : 'center',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: isMobileModal ? '100%' : '560px',
                    cursor: 'default'
                }}
            >
                <div style={{ position: 'relative', width: '100%', maxWidth: isMobileModal ? '100%' : '480px' }}>
                    <div className="card animate-fade-in custom-scroll" style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        borderRadius: isMobileModal ? '28px 28px 0 0' : '28px',
                        padding: isMobileModal ? '24px 20px 40px' : '32px',
                        position: 'relative',
                        maxHeight: isMobileModal ? '92vh' : '85vh',
                        overflowY: 'auto',
                        scrollbarGutter: 'stable',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <button onClick={onClose} style={{ position: 'absolute', right: '16px', top: '16px', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', zIndex: 20 }}>
                            <X size={20} />
                        </button>

                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '24px', textAlign: 'center', letterSpacing: '-0.5px' }}>Nova Movimentação</h2>

                        {/* Selector de Tipo */}
                        <div style={{ background: 'var(--bg-secondary)', padding: '4px', borderRadius: '16px', display: 'flex', marginBottom: '32px' }}>
                            {['expense', 'income', 'bill', 'investment'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
                                        background: type === t ? '#FFFFFF' : 'transparent',
                                        color: type === t ? getThemeColor(t) : 'var(--text-secondary)',
                                        fontWeight: type === t ? '700' : '600',
                                        fontSize: '0.85rem',
                                        boxShadow: type === t ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                                        cursor: 'pointer', transition: 'all 0.3s ease'
                                    }}
                                >
                                    {{ expense: 'Despesa', income: 'Receita', bill: 'Conta', investment: 'Investir' }[t]}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); save(); }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                            {/* Valor Input Premium */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', borderRadius: '20px', background: getThemeColor() + '08' }}>
                                    <span style={{ fontSize: '1.75rem', fontWeight: '800', color: getThemeColor() }}>R$</span>
                                    <input
                                        type="text" inputMode="numeric" value={amount}
                                        onChange={handleAmountChange}
                                        placeholder="0,00" autoFocus
                                        style={{ fontSize: '2.5rem', fontWeight: '800', border: 'none', background: 'transparent', width: '180px', textAlign: 'center', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                </div>
                                {touched.amount && errors.amount && <span style={{ color: '#FF3B30', fontSize: '0.75rem', marginTop: '8px', fontWeight: '600' }}>{errors.amount}</span>}
                            </div>

                            {/* Categorias Horizontal Scroll */}
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '12px', display: 'block' }}>Categoria</label>
                                <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                                    <button type="button" onClick={() => setIsCreatingCategory(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', minWidth: '64px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '2px dashed var(--border)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} /></div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Nova</span>
                                    </button>
                                    {availableCategories.map(cat => (
                                        <button key={cat.id} type="button" onClick={() => {
                                            setSelectedCategoryId(cat.id);
                                            hapticFeedback('light');
                                        }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', minWidth: '64px', opacity: selectedCategoryId === cat.id ? 1 : 0.4, transform: selectedCategoryId === cat.id ? 'scale(1.1)' : 'scale(1)', transition: '0.2s' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: selectedCategoryId === cat.id ? cat.color : 'var(--bg-secondary)', color: selectedCategoryId === cat.id ? '#FFF' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>{cat.icon}</div>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: selectedCategoryId === cat.id ? '700' : '600' }}>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Campos de Texto */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                                <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '14px 18px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Descrição</label>
                                    <input value={description} onChange={e => setDescription(e.target.value)} placeholder={placeholder} style={{ border: 'none', background: 'transparent', fontSize: '1rem', outline: 'none', width: '100%', fontWeight: '500' }} />
                                    {touched.description && errors.description && <span style={{ color: '#FF3B30', fontSize: '0.65rem', fontWeight: '600' }}>{errors.description}</span>}
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '14px 18px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Data</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '0.95rem', outline: 'none', width: '100%', fontWeight: '500' }} />
                                </div>
                            </div>

                            {/* Opções Avançadas */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Cartão (Apenas Despesa) */}
                                {type === 'expense' && (
                                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '14px 18px' }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Cartão</label>
                                        <select value={cardId} onChange={e => setCardId(e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1rem', outline: 'none', fontWeight: '500' }}>
                                            <option value="">Carteira / Dinheiro</option>
                                            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Toggles */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Dividir em Parcelas (Apenas Despesa) */}
                                    {type === 'expense' && !isRecurring && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: '10px' }}><Repeat size={18} color="var(--primary)" /></div>
                                                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Parcelar</span>
                                            </div>
                                            <input type="number" min="1" max="48" value={installments} onChange={e => setInstallments(parseInt(e.target.value))} style={{ width: '50px', padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center', fontWeight: '700' }} />
                                        </div>
                                    )}

                                    {/* Recorrência Mensal */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: '10px' }}><Repeat size={18} color="var(--primary)" /></div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Recorrência Mensal</span>
                                        </div>
                                        <label className="switch">
                                            <input type="checkbox" checked={isRecurring} onChange={e => {
                                                setIsRecurring(e.target.checked);
                                                hapticFeedback('light');
                                            }} />
                                            <span className="slider"></span>
                                        </label>
                                    </div>

                                    {/* Dividir com Grupo */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: '10px' }}><Users size={18} color="var(--primary)" /></div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Dividir com Grupo</span>
                                        </div>
                                        <label className="switch">
                                            <input type="checkbox" checked={isGroupTransaction} onChange={e => {
                                                setIsGroupTransaction(e.target.checked);
                                                hapticFeedback('light');
                                            }} />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                </div>

                                {/* Seleção de Grupo e Participantes */}
                                {isGroupTransaction && (
                                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Qual Grupo?</label>
                                            <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1rem', outline: 'none', fontWeight: '500' }}>
                                                <option value="">Sem grupo</option>
                                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>

                                        {/* Modo de Divisão */}
                                        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '12px' }}>
                                            {['equal', 'custom'].map(m => (
                                                <button
                                                    key={m} type="button" onClick={() => setSplitMode(m)}
                                                    style={{
                                                        flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                                                        background: splitMode === m ? '#FFF' : 'transparent',
                                                        color: splitMode === m ? 'var(--primary)' : 'var(--text-secondary)',
                                                        fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                                                        boxShadow: splitMode === m ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
                                                    }}
                                                >
                                                    {m === 'equal' ? 'Igual' : 'Manual'}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Busca/Adição de Perfil Externo */}
                                        <div style={{ position: 'relative' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                            <input
                                                placeholder="Adicionar externa..."
                                                value={participantSearch}
                                                onChange={e => setParticipantSearch(e.target.value)}
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter' && participantSearch.trim()) {
                                                        e.preventDefault();
                                                        try {
                                                            const p = await addProfile(participantSearch.trim());
                                                            if (p) {
                                                                setSelectedProfiles(prev => [...prev.map(item => ({ ...item, isSelected: item.isSelected })), { ...p, isSelected: true, isOwner: false }]);
                                                                setParticipantSearch('');
                                                            }
                                                        } catch (err) { }
                                                    }
                                                }}
                                                style={{ width: '100%', padding: '10px 10px 10px 34px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', fontSize: '0.85rem', outline: 'none' }}
                                            />
                                        </div>

                                        {/* Lista Mini de Participantes */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Participantes</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button type="button" onClick={() => setSelectedProfiles(prev => prev.map(p => ({ ...p, isSelected: true })))} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}>Marcar todos</button>
                                                <button type="button" onClick={() => setSelectedProfiles(prev => prev.map(p => ({ ...p, isSelected: false })))} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}>Nenhum</button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scroll">
                                            {selectedProfiles.length === 0 && (
                                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Nenhum participante encontrado</div>
                                            )}
                                            {selectedProfiles.map(profile => (
                                                <div key={profile.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '12px', background: profile.isSelected ? 'var(--bg-card)' : 'transparent', border: `1px solid ${profile.isSelected ? 'var(--border-light)' : 'transparent'}`, opacity: profile.isSelected ? 1 : 0.5, cursor: 'pointer' }} onClick={() => {
                                                    setSelectedProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, isSelected: !p.isSelected } : p));
                                                }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: profile.isOwner ? 'var(--primary)' : '#CCC', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>{profile.name?.substring(0, 1).toUpperCase()}</div>
                                                    <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</div>

                                                    {splitMode === 'custom' && profile.isSelected && (
                                                        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '6px' }}>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: '800' }}>R$</span>
                                                            <input
                                                                value={customShares[profile.id] || ''}
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(/[^\d,]/g, '');
                                                                    setCustomShares(prev => ({ ...prev, [profile.id]: val }));
                                                                }}
                                                                placeholder="0,00"
                                                                style={{ width: '50px', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', fontWeight: '700', textAlign: 'right' }}
                                                            />
                                                        </div>
                                                    )}

                                                    <div style={{ width: '18px', height: '18px', borderRadius: '6px', border: `2px solid ${profile.isSelected ? 'var(--primary)' : 'var(--border)'}`, background: profile.isSelected ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {profile.isSelected && <Check size={12} color="#FFF" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                onClick={() => hapticFeedback('medium')}
                                style={{
                                    background: getThemeColor(),
                                    color: '#FFF',
                                    border: 'none',
                                    padding: '18px',
                                    borderRadius: '20px',
                                    fontSize: '1.1rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    boxShadow: `0 12px 24px ${getThemeColor()}30`,
                                    transition: 'all 0.3s ease',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                    marginTop: '10px'
                                }}
                            >
                                {isSaving ? 'Salvando...' : <><Check size={22} /> Confirmar Lançamento</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {isCreatingCategory && <NewCategoryModal type={type} onClose={() => setIsCreatingCategory(false)} onCreated={() => { }} />}
            {isCardModalOpen && <NewCardModal onClose={() => setIsCardModalOpen(false)} onCreated={(c) => setCardId(c.id)} />}
        </div>
    );
}
