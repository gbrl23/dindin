import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { ArrowLeft, Plus, Users, DollarSign, Settings, UserPlus, Trash2, Save, X, Receipt, LogOut } from 'lucide-react';

export default function GroupDetailsView() {
    const { id: groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedDate } = useDashboard();

    // Hooks
    const { groups, getGroupMembers, getGroupBalances, inviteUser, updateGroup, deleteGroup, leaveGroup, loading: groupsLoading } = useGroups();

    // Local State
    const [balances, setBalances] = useState([]);
    const [members, setMembers] = useState([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);
    const [groupTransactions, setGroupTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [selectedMembers, setSelectedMembers] = useState([]); // Empty = all members

    // Edit Modal State
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [editData, setEditData] = useState({ name: '', description: '', icon: '', color: '' });

    // Derived Data
    const group = useMemo(() => groups.find(g => g.id === groupId), [groups, groupId]);

    const isAdmin = group?.my_role === 'owner' || group?.my_role === 'admin';
    const isOwner = group?.my_role === 'owner';

    // Filter transactions by selected members
    const filteredTransactions = useMemo(() => {
        if (selectedMembers.length === 0) return groupTransactions;
        return groupTransactions.filter(t => selectedMembers.includes(t.payer_id));
    }, [groupTransactions, selectedMembers]);

    // Fetch group transactions with date range filter
    const fetchGroupTransactions = async () => {
        setLoadingTransactions(true);
        try {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 1);

            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    id, description, amount, date, payer_id, card_id, type,
                    payer:profiles!payer_id(full_name),
                    transaction_shares(
                        profile_id,
                        share_amount,
                        status
                    )
                `)
                .eq('group_id', groupId)
                .eq('type', 'expense')
                .gte('date', startStr)
                .lt('date', endStr)
                .order('date', { ascending: false });

            if (error) throw error;

            const normalized = (data || []).map(t => ({
                ...t,
                people_count: t.transaction_shares?.length ?? 0,
                shares_total: (t.transaction_shares ?? []).reduce((sum, sh) => sum + Number(sh.share_amount), 0)
            }));

            setGroupTransactions(normalized);
        } catch (error) {
            console.error('Error fetching group transactions:', error);
            setGroupTransactions([]);
        } finally {
            setLoadingTransactions(false);
        }
    };

    useEffect(() => {
        if (groupId) {
            setIsLoadingBalances(true);
            getGroupBalances(groupId)
                .then(data => setBalances(data))
                .catch(err => console.error("Failed to load balances", err))
                .finally(() => setIsLoadingBalances(false));

            getGroupMembers(groupId)
                .then(data => setMembers(data))
                .catch(err => console.error("Failed to load members", err));

            fetchGroupTransactions();
        }
    }, [groupId, selectedDate]);

    useEffect(() => {
        if (group && isSettingsModalOpen) {
            setEditData({
                name: group.name,
                description: group.description || '',
                icon: group.icon || '👥',
                color: group.color || '#3B82F6'
            });
        }
    }, [group, isSettingsModalOpen]);

    const formatMonth = (date) => {
        const str = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Handlers
    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            await inviteUser(groupId, inviteEmail);
            alert('Convite enviado com sucesso!');
            setInviteEmail('');
            setIsInviteModalOpen(false);
        } catch (error) {
            alert(`Erro ao enviar convite: ${error.message}`);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateGroup(groupId, editData);
            setIsSettingsModalOpen(false);
        } catch (error) {
            alert(`Erro ao atualizar: ${error.message}`);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este grupo? Todas as despesas e histórico serão apagados permanentemente.')) return;
        try {
            await deleteGroup(groupId);
            navigate('/groups');
        } catch (error) {
            alert(`Erro ao excluir: ${error.message}`);
        }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm('Tem certeza que deseja sair deste grupo? Você perderá acesso a todas as despesas compartilhadas.')) return;
        try {
            await leaveGroup(groupId);
            navigate('/groups');
        } catch (error) {
            alert(`Erro ao sair: ${error.message}`);
        }
    };

    // Calculate totals
    const totalExpenses = groupTransactions.reduce((sum, t) => sum + t.amount, 0);

    if (groupsLoading && !group) return <div className="container" style={{ textAlign: 'center', padding: '40px' }}>Carregando grupo...</div>;
    if (!group && !groupsLoading) return <div className="container" style={{ textAlign: 'center', padding: '40px' }}>Grupo não encontrado.</div>;

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '100px', marginTop: '24px' }}>

            {/* Header */}
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/groups')}
                        style={{
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '2px' }}>
                            {group?.icon} {group?.name}
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {group?.description || `${members.length} membros`}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--primary)',
                            border: 'none',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                        title="Convidar membro"
                    >
                        <UserPlus size={18} />
                    </button>
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: 'none',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                        title="Configurações"
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        onClick={handleLeaveGroup}
                        style={{
                            background: 'rgba(255, 149, 0, 0.1)',
                            color: 'var(--warning)',
                            border: 'none',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                        title="Sair do grupo"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Summary Card - Gradient style matching InvestmentsView */}
            <div className="card" style={{
                padding: '24px',
                marginBottom: '24px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                border: 'none',
                borderRadius: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', opacity: 0.9 }}>
                    <Users size={20} />
                    <span style={{ fontSize: '1rem', fontWeight: '500' }}>Total do Mês</span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                    R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px' }}>
                    {groupTransactions.length} despesa{groupTransactions.length !== 1 ? 's' : ''} • {members.length} membros
                </div>
            </div>

            {/* Balances Section */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <DollarSign size={18} /> Balanços
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Histórico total
                    </span>
                </div>

                {isLoadingBalances ? (
                    <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Calculando...
                    </div>
                ) : balances.length === 0 ? (
                    <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
                        ✅ Tudo quitado! Ninguém deve nada.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {balances.map(b => (
                            <div
                                key={b.profile_id}
                                className="card"
                                style={{
                                    padding: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderRadius: '16px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: b.balance > 0 ? 'rgba(52, 199, 89, 0.15)' : (b.balance < 0 ? 'rgba(255, 69, 58, 0.15)' : 'var(--bg-secondary)'),
                                        color: b.balance > 0 ? 'var(--success)' : (b.balance < 0 ? 'var(--danger)' : 'var(--text-secondary)'),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem',
                                        fontWeight: '600'
                                    }}>
                                        {b.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                            {b.full_name}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {b.profile_id === user?.profile_id ? 'Você' : 'Membro'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    color: b.balance > 0 ? 'var(--success)' : (b.balance < 0 ? 'var(--danger)' : 'var(--text-secondary)')
                                }}>
                                    {b.balance > 0
                                        ? `Recebe R$ ${Number(b.balance).toFixed(2)}`
                                        : (b.balance < 0
                                            ? `Deve R$ ${Math.abs(Number(b.balance)).toFixed(2)}`
                                            : 'Zerado'
                                        )
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Members Section */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} /> Membros ({members.length})
                </h2>
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                    {members.map(m => (
                        <div
                            key={m.user_id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'var(--bg-card)',
                                padding: '16px 20px',
                                borderRadius: '16px',
                                border: '1px solid var(--border)',
                                minWidth: '100px',
                                flexShrink: 0
                            }}
                        >
                            <img
                                src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=random&bold=true`}
                                alt={m.full_name}
                                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', textAlign: 'center' }}>
                                {m.full_name?.split(' ')[0] || '...'}
                            </span>
                            {m.role === 'owner' && (
                                <span style={{
                                    fontSize: '0.65rem',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '20px',
                                    fontWeight: '600'
                                }}>
                                    Dono
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Expenses Section Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Receipt size={18} /> Despesas de {formatMonth(selectedDate)}
                </h2>

                <button
                    onClick={() => navigate(`/add-transaction?type=expense&groupId=${groupId}`)}
                    className="btn btn-primary"
                    style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <Plus size={18} />
                    Nova Despesa
                </button>
            </div>

            {/* Member Filter */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'none'
            }}>
                <button
                    onClick={() => setSelectedMembers([])}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        background: selectedMembers.length === 0 ? 'var(--primary)' : 'var(--bg-secondary)',
                        color: selectedMembers.length === 0 ? 'white' : 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s'
                    }}
                >
                    Todos
                </button>
                {members.map(m => {
                    const isSelected = selectedMembers.includes(m.id);
                    return (
                        <button
                            key={m.id}
                            onClick={() => {
                                if (isSelected) {
                                    setSelectedMembers(prev => prev.filter(id => id !== m.id));
                                } else {
                                    setSelectedMembers(prev => [...prev, m.id]);
                                }
                            }}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                border: 'none',
                                background: isSelected ? 'var(--primary)' : 'var(--bg-secondary)',
                                color: isSelected ? 'white' : 'var(--text-secondary)',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexShrink: 0,
                                transition: 'all 0.2s'
                            }}
                        >
                            <img
                                src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name || 'U')}&background=random&size=20`}
                                alt=""
                                style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                            />
                            {m.full_name?.split(' ')[0] || '...'}
                        </button>
                    );
                })}
            </div>

            {/* Expenses List */}
            {loadingTransactions ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Carregando despesas...
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '48px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '20px',
                    color: 'var(--text-secondary)'
                }}>
                    <Receipt size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <p style={{ margin: 0, fontWeight: '500' }}>
                        {selectedMembers.length > 0
                            ? 'Nenhuma despesa encontrada para os membros selecionados'
                            : `Nenhuma despesa em ${formatMonth(selectedDate)}`
                        }
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredTransactions.map(t => (
                        <div
                            key={t.id}
                            className="card"
                            style={{
                                padding: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                            onClick={() => navigate(`/edit-transaction/${t.id}`)}
                        >
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '14px',
                                    background: 'rgba(255, 69, 58, 0.12)',
                                    color: 'var(--danger)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Receipt size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '2px' }}>
                                        {t.description}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Pago por {t.payer?.full_name?.split(' ')[0] || 'Alguém'} • {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--danger)' }}>
                                    - R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                {t.people_count > 1 && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        ÷ {t.people_count} pessoas
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* INVITE MODAL */}
            {isInviteModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div
                        className="card animate-scale-in"
                        style={{
                            width: '100%',
                            maxWidth: '380px',
                            padding: '24px',
                            borderRadius: '24px'
                        }}
                    >
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>
                            Convidar Membro
                        </h3>
                        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                    Email do usuário
                                </label>
                                <input
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    autoFocus
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-secondary)',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsInviteModalOpen(false)}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '12px',
                                        background: 'var(--bg-secondary)',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '14px', borderRadius: '12px' }}
                                >
                                    Enviar Convite
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SETTINGS MODAL */}
            {isSettingsModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div
                        className="card animate-scale-in"
                        style={{
                            width: '100%',
                            maxWidth: '420px',
                            padding: '24px',
                            borderRadius: '24px',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Configurações</h3>
                            <button
                                onClick={() => setIsSettingsModalOpen(false)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: 'none',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>
                                    Ícone
                                </label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {['🏠', '✈️', '🎉', '🍕', '🍻', '🛍️', '🎁', '💼', '🎮', '🏖️'].map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setEditData({ ...editData, icon })}
                                            style={{
                                                fontSize: '1.5rem',
                                                padding: '10px',
                                                borderRadius: '12px',
                                                border: editData.icon === icon ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: editData.icon === icon ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                    Nome do Grupo
                                </label>
                                <input
                                    value={editData.name}
                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-secondary)',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                    Descrição (opcional)
                                </label>
                                <textarea
                                    value={editData.description}
                                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-secondary)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        resize: 'none'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{
                                    padding: '14px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    marginTop: '8px'
                                }}
                            >
                                <Save size={18} /> Salvar Alterações
                            </button>
                        </form>

                        {isOwner && (
                            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                                <h4 style={{ fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '12px', fontWeight: '600' }}>
                                    Zona de Perigo
                                </h4>
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 69, 58, 0.1)',
                                        color: 'var(--danger)',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} /> Excluir Grupo
                                </button>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>
                                    Esta ação não pode ser desfeita.
                                </p>
                            </div>
                        )}

                        {/* Sair do Grupo - para todos */}
                        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <button
                                onClick={handleLeaveGroup}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 149, 0, 0.1)',
                                    color: 'var(--warning)',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Sair do Grupo
                            </button>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>
                                Você perderá acesso às despesas compartilhadas.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
