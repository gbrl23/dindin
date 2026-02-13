import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Users, Upload, Calendar, CreditCard, Repeat, Plus, Target, Search, X, Trash2 } from 'lucide-react';
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
        <div className="container" style={{ paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', padding: isMobile ? '0 16px' : '20px' }}>
            {/* Header Premium */}
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', marginTop: '16px' }}>
                <button onClick={() => navigate(-1)} style={{ width: 44, height: 44, borderRadius: '14px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer', transition: '0.2s' }}>
                    <ArrowLeft size={22} />
                </button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                    {editingTx ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h1>
                {editingTx ? (
                    <button
                        onClick={() => editingTx.series_id ? setShowDeleteChoice(true) : (window.confirm('Excluir?') && supabase.from('transactions').delete().eq('id', id).then(() => navigate(-1)))}
                        style={{ width: 44, height: 44, borderRadius: '14px', background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3B30', border: '1px solid #FFE0E0', cursor: 'pointer' }}
                    >
                        <Trash2 size={20} />
                    </button>
                ) : <div style={{ width: 44 }} />}
            </header>

            <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* Tipo de Transação */}
                <div style={{ background: 'var(--bg-secondary)', padding: '5px', borderRadius: '18px', display: 'flex', border: '1px solid var(--border)' }}>
                    {['expense', 'income', 'bill', 'investment'].map(t => (
                        <button
                            key={t} type="button" onClick={() => {
                                setType(t);
                                hapticFeedback('light');
                            }}
                            style={{
                                flex: 1, padding: '12px 0', borderRadius: '14px', border: 'none',
                                background: type === t ? '#FFFFFF' : 'transparent',
                                boxShadow: type === t ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                color: type === t ? getThemeColor(t) : 'var(--text-secondary)',
                                fontWeight: type === t ? '700' : '600', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s ease'
                            }}
                        >
                            {{ expense: 'Despesa', income: 'Receita', bill: 'Conta', investment: 'Investir' }[t]}
                        </button>
                    ))}
                </div>

                {/* Valor Input Premium */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: '800', color: getThemeColor(), opacity: 0.8 }}>R$</span>
                        <input
                            type="text" inputMode="numeric" value={amount}
                            onChange={handleAmountChange}
                            placeholder="0,00"
                            style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: '900', color: 'var(--text-primary)', background: 'transparent', border: 'none', outline: 'none', width: isMobile ? '200px' : '300px', textAlign: 'center', letterSpacing: '-1px' }}
                        />
                    </div>
                </div>

                {/* Card Principal */}
                <div className="card" style={{ padding: '28px', borderRadius: '28px', display: 'flex', flexDirection: 'column', gap: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid var(--border)' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>O que foi?</label>
                        <input value={description} onChange={e => setDescription(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '18px', borderRadius: '18px', background: 'var(--bg-secondary)', border: '1px solid transparent', fontSize: '1rem', fontWeight: '600', outline: 'none', transition: '0.2s' }} onFocus={e => e.target.style.borderColor = getThemeColor()} onBlur={e => e.target.style.borderColor = 'transparent'} />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '14px', display: 'block' }}>Categoria</label>
                        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                            <button type="button" onClick={() => setIsCreatingCategory(true)} style={{ minWidth: '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: 'var(--bg-secondary)', border: '2px dashed var(--border)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={24} /></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Nova</span>
                            </button>
                            {availableCategories.map(cat => (
                                <button key={cat.id} type="button" onClick={() => {
                                    setSelectedCategoryId(cat.id);
                                    hapticFeedback('light');
                                }} style={{ minWidth: '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: selectedCategoryId === cat.id ? 1 : 0.4, transform: selectedCategoryId === cat.id ? 'scale(1.05)' : 'scale(1)', transition: '0.2s' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: selectedCategoryId === cat.id ? cat.color : 'var(--bg-secondary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', boxShadow: selectedCategoryId === cat.id ? `0 8px 20px ${cat.color}30` : 'none' }}>{cat.icon}</div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Quando?</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '18px', background: 'var(--bg-secondary)', border: 'none', fontSize: '1rem', fontWeight: '600', outline: 'none' }} />
                            </div>
                        </div>

                        {type === 'expense' && (
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Como pagou?</label>
                                <div style={{ position: 'relative' }}>
                                    <CreditCard size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                    <select value={cardId} onChange={e => setCardId(e.target.value)} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '18px', background: 'var(--bg-secondary)', border: 'none', fontSize: '1rem', fontWeight: '600', outline: 'none', appearance: 'none' }}>
                                        <option value="">Carteira / Dinheiro</option>
                                        {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Divisão de Grupo e Opções Avançadas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                        <div className="card" style={{ padding: '20px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '10px', background: '#F2F2F7', borderRadius: '14px', color: 'var(--primary)' }}><Users size={20} /></div>
                                <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>Dividir com Grupo</span>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={isGroupTransaction} onChange={e => {
                                    setIsGroupTransaction(e.target.checked);
                                    hapticFeedback('light');
                                }} />
                                <span className="slider"></span>
                            </label>
                        </div>

                        <div className="card" style={{ padding: '20px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '10px', background: '#F2F2F7', borderRadius: '14px', color: 'var(--primary)' }}><Repeat size={20} /></div>
                                <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>Recorrência</span>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={isRecurring} onChange={e => {
                                    setIsRecurring(e.target.checked);
                                    hapticFeedback('light');
                                }} />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    {type === 'expense' && !isRecurring && (
                        <div className="card" style={{ padding: '20px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '10px', background: '#F2F2F7', borderRadius: '14px', color: 'var(--primary)' }}><Repeat size={20} /></div>
                                <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>Parcelar</span>
                            </div>
                            <input type="number" min="1" max="48" value={installments} onChange={e => setInstallments(parseInt(e.target.value))} style={{ width: '50px', border: 'none', background: 'var(--bg-secondary)', borderRadius: '10px', textAlign: 'center', fontWeight: '800', fontSize: '1rem', padding: '8px' }} />
                        </div>
                    )}

                    {isGroupTransaction && (
                        <div className="card" style={{ padding: '24px', borderRadius: '28px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Qual Grupo?</label>
                                <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--bg-secondary)', fontWeight: '600', outline: 'none' }}>
                                    <option value="">Sem grupo</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>

                            {/* Seletor de Modo de Divisão */}
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Como dividir?</label>
                                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '14px' }}>
                                    {[
                                        { id: 'equal', label: 'Igual' },
                                        { id: 'custom', label: 'Manual/Proporcional' }
                                    ].map(mode => (
                                        <button
                                            key={mode.id} type="button" onClick={() => setSplitMode(mode.id)}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                                                background: splitMode === mode.id ? '#FFF' : 'transparent',
                                                color: splitMode === mode.id ? 'var(--primary)' : 'var(--text-secondary)',
                                                fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                                                boxShadow: splitMode === mode.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                            }}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Busca/Adição de Perfil Externo */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Participantes</label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button type="button" onClick={() => setSelectedProfiles(prev => prev.map(p => ({ ...p, isSelected: true })))} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Marcar todos</button>
                                        <button type="button" onClick={() => setSelectedProfiles(prev => prev.map(p => ({ ...p, isSelected: false })))} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Nenhum</button>
                                    </div>
                                </div>
                                <div style={{ position: 'relative', marginBottom: '16px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                    <input
                                        placeholder="Adicionar externa (ex: Amigo)..."
                                        value={participantSearch}
                                        onChange={e => setParticipantSearch(e.target.value)}
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter' && participantSearch.trim()) {
                                                e.preventDefault();
                                                try {
                                                    const newProfile = await addProfile(participantSearch.trim());
                                                    if (newProfile) {
                                                        setSelectedProfiles(prev => [...prev.map(p => ({ ...p, isSelected: true })), { ...newProfile, isSelected: true, isOwner: false }]);
                                                        setParticipantSearch('');
                                                    }
                                                } catch (err) { alert('Erro ao criar perfil'); }
                                            }
                                        }}
                                        style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', fontSize: '0.9rem', outline: 'none' }}
                                    />
                                    {participantSearch && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    const newProfile = await addProfile(participantSearch.trim());
                                                    if (newProfile) {
                                                        setSelectedProfiles(prev => [...prev.map(p => ({ ...p, isSelected: p.isSelected })), { ...newProfile, isSelected: true, isOwner: false }]);
                                                        setParticipantSearch('');
                                                    }
                                                } catch (err) { alert('Erro ao criar perfil'); }
                                            }}
                                            style={{ position: 'absolute', right: '4px', top: '4px', bottom: '4px', background: 'var(--primary)', color: '#FFF', border: 'none', borderRadius: '8px', padding: '0 12px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            Criar
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {selectedProfiles.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Nenhum participante encontrado</div>
                                    )}
                                    {selectedProfiles.map(profile => (
                                        <div key={profile.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '14px', background: profile.isSelected ? 'var(--bg-secondary)' : 'transparent', border: `1px solid ${profile.isSelected ? 'var(--border-light)' : 'transparent'}`, opacity: profile.isSelected ? 1 : 0.6, cursor: 'pointer' }} onClick={() => {
                                            setSelectedProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, isSelected: !p.isSelected } : p));
                                        }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: profile.isOwner ? 'var(--primary)' : '#E0E0E0', color: profile.isOwner ? '#FFF' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                                                {profile.name?.substring(0, 1).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{profile.name} {profile.isOwner && '(Você)'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{profile.user_id ? 'Perfil' : 'Convidado'}</div>
                                            </div>
                                            {splitMode === 'custom' && profile.isSelected && (
                                                <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFF', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>R$</span>
                                                    <input
                                                        value={customShares[profile.id] || ''}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/[^\d,]/g, '');
                                                            setCustomShares(prev => ({ ...prev, [profile.id]: val }));
                                                        }}
                                                        placeholder="0,00"
                                                        style={{ width: '60px', border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: '700', textAlign: 'right' }}
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

                <button
                    type="submit"
                    disabled={isSaving}
                    onClick={() => hapticFeedback('medium')}
                    style={{
                        padding: '20px', borderRadius: '22px', background: getThemeColor(), color: '#fff', border: 'none', fontSize: '1.2rem', fontWeight: '900', cursor: 'pointer', boxShadow: `0 15px 35px ${getThemeColor()}40`, transition: '0.3s'
                    }}
                >
                    {isSaving ? 'Salvando...' : editingTx ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                </button>
            </form>

            <SeriesActionModal isOpen={showEditChoice} action="edit" onClose={() => setShowEditChoice(false)} onConfirm={save} />
            <SeriesActionModal isOpen={showDeleteChoice} action="delete" onClose={() => setShowDeleteChoice(false)} onConfirm={(scope) => removeTransactionSeries(id, editingTx.series_id, scope).then(() => navigate(-1))} />
            {isCreatingCategory && <NewCategoryModal type={type} onClose={() => setIsCreatingCategory(false)} onCreated={refreshCategories} />}
        </div>
    );
}
