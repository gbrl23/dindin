import React, { useState, useMemo, useEffect } from 'react';
import { useProfiles } from '../../hooks/useProfiles';
import { useTransactions } from '../../hooks/useTransactions';
import { useSharePayments } from '../../hooks/useSharePayments';
import { useAuth } from '../../contexts/AuthContext';
import { User, Trash2, Plus, ArrowLeft, ChevronRight, CheckCircle2, UserCheck, Users, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilesView() {
    const { profiles, addProfile, removeProfile } = useProfiles();
    const { transactions, fetchTransactions } = useTransactions();
    const { fetchPaymentsForShare } = useSharePayments();
    const { user } = useAuth();
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const navigate = useNavigate();

    // Fetch transactions on mount
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            await addProfile(newName.trim(), newEmail.trim() || null);
            setNewName('');
            setNewEmail('');
        } catch (error) {
            alert('Erro ao adicionar perfil');
        }
    };

    // Actual debts calculation state (Owed to Me)
    const [actualDebts, setActualDebts] = useState({});
    const [loadingDebts, setLoadingDebts] = useState(true);

    const myProfile = useMemo(() => profiles.find(p => p.user_id === user?.id), [profiles, user]);

    useEffect(() => {
        const calculateActualDebts = async () => {
            if (!myProfile) return;

            setLoadingDebts(true);
            const debtsWithPayments = {};

            for (const profile of profiles) {
                if (profile.id === myProfile.id) continue;

                let totalRemaining = 0;

                // Only consider transactions where I (the owner) am the payer
                // and the other profile has a share.
                for (const transaction of transactions) {
                    if (transaction.payer_id !== myProfile.id) continue;

                    const share = transaction.shares?.find(s => s.profile_id === profile.id);

                    if (share) {
                        const payments = await fetchPaymentsForShare(share.transaction_id, share.profile_id);
                        const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                        const remaining = share.share_amount - totalPaid;
                        totalRemaining += Math.max(0, remaining);
                    }
                }
                debtsWithPayments[profile.id] = totalRemaining;
            }

            setActualDebts(debtsWithPayments);
            setLoadingDebts(false);
        };

        if (profiles.length > 0 && myProfile) {
            calculateActualDebts();
        } else {
            setLoadingDebts(false);
        }
    }, [profiles, transactions, fetchPaymentsForShare, myProfile]);

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '100px', marginTop: '24px' }}>
            <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                    onClick={() => navigate(-1)}
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
                        Perfis e Divisões
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Gerencie quem divide despesas com você
                    </p>
                </div>
            </header>

            {/* Add Profile Form - Standardized style */}
            <div className="card" style={{
                marginBottom: '32px',
                padding: '24px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)'
            }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} color="var(--primary)" /> Adicionar Participante
                </h2>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '200px' }}>
                        <input
                            className="input"
                            placeholder="Nome (ex: João, Maria)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                            style={{ borderRadius: '12px' }}
                        />
                    </div>
                    <div style={{ flex: 2, minWidth: '200px' }}>
                        <input
                            className="input"
                            type="email"
                            placeholder="Email (opcional)"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            style={{ borderRadius: '12px' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{
                        padding: '0 24px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        height: '42px'
                    }}>
                        Adicionar
                    </button>
                </form>
            </div>

            {/* Total Balance Summary Card - Matching Group/Investments style */}
            {!loadingDebts && Object.values(actualDebts).some(d => d > 0) && (
                <div className="card" style={{
                    padding: '24px',
                    marginBottom: '24px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Amber gradient for debts
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)',
                    border: 'none',
                    borderRadius: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', opacity: 0.9 }}>
                        <DollarSign size={20} />
                        <span style={{ fontSize: '1rem', fontWeight: '500' }}>Total a Receber</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                        R$ {Object.values(actualDebts).reduce((acc, curr) => acc + curr, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px' }}>
                        Soma das divisões pendentes com todos os participantes
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <Users size={18} /> Balanços por Perfil
                    </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {profiles.map(profile => {
                        const debt = actualDebts[profile.id] || 0;
                        const isGhost = !profile.user_id;
                        const hasDebt = debt > 0.01;

                        return (
                            <div
                                key={profile.id}
                                className="card hover-scale"
                                style={{
                                    display: 'flex',
                                    padding: '16px',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderRadius: '16px',
                                    cursor: !profile.isOwner ? 'pointer' : 'default',
                                    background: profile.isOwner ? 'rgba(81, 0, 255, 0.03)' : 'var(--bg-card)',
                                    border: profile.isOwner ? '1px solid var(--primary)' : '1px solid var(--border)'
                                }}
                                onClick={() => !profile.isOwner && navigate(`/profile/${profile.id}`)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: profile.isOwner ? 'var(--primary)' : (hasDebt ? 'rgba(245, 158, 11, 0.15)' : 'rgba(52, 199, 89, 0.15)'),
                                        color: profile.isOwner ? '#fff' : (hasDebt ? 'var(--warning)' : 'var(--success)'),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem',
                                        fontWeight: '600'
                                    }}>
                                        {profile.isOwner ? <UserCheck size={20} /> : (profile.name?.charAt(0).toUpperCase())}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{profile.name}</span>
                                            {profile.isOwner ? (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    padding: '2px 8px',
                                                    borderRadius: '20px',
                                                    fontWeight: '600'
                                                }}>Dono</span>
                                            ) : isGhost && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-secondary)',
                                                    padding: '2px 8px',
                                                    borderRadius: '20px',
                                                    border: '1px solid var(--border)',
                                                    fontWeight: '600'
                                                }}>Membro</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {profile.email || (isGhost ? 'Participante convidado' : 'Usuário registrado')}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {!profile.isOwner && (
                                        <div style={{
                                            fontWeight: '700',
                                            fontSize: '1rem',
                                            color: hasDebt ? 'var(--warning)' : 'var(--success)',
                                            textAlign: 'right'
                                        }}>
                                            {hasDebt ? `Deve R$ ${debt.toFixed(2)}` : 'Zerado'}
                                        </div>
                                    )}

                                    {!profile.isOwner && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Tem certeza que deseja remover ${profile.name}? Isso não apagará os gastos vinculados.`)) {
                                                        removeProfile(profile.id).catch(() => {
                                                            alert('Não foi possível remover este perfil. Ele pode estar vinculado a gastos existentes.');
                                                        });
                                                    }
                                                }}
                                                style={{
                                                    color: 'var(--danger)',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    opacity: 0.7
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {loadingDebts && (
                <div style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Calculando balanços...
                </div>
            )}
        </div>
    );
}
