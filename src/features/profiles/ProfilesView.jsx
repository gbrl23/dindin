import React, { useState, useMemo, useEffect } from 'react';
import { useProfiles } from '../../hooks/useProfiles';
import { useTransactions } from '../../hooks/useTransactions';
import { useSharePayments } from '../../hooks/useSharePayments';
import { useAuth } from '../../contexts/AuthContext';
import { User, Trash2, Plus, ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilesView() {
    const { profiles, addProfile, removeProfile } = useProfiles();
    const { transactions, fetchTransactions } = useTransactions();
    const { fetchPaymentsForShare } = useSharePayments();
    const { user } = useAuth();
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const navigate = useNavigate();

    // Fetch transactions on mount to ensure debt calculations are up to date
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

    // Calculate debt for each profile
    const profileDebts = useMemo(() => {
        const debts = {};

        profiles.forEach(profile => {
            // Calculate total owed by this profile
            // They owe money when they have a share in a transaction they didn't pay for
            const totalOwed = transactions.reduce((sum, transaction) => {
                // Find if this profile has a share in this transaction
                const share = transaction.shares?.find(s => s.profile_id === profile.id);

                // If they have a share AND they're not the payer, they owe this amount
                if (share && transaction.payer_id !== profile.id) {
                    return sum + share.share_amount;
                }

                return sum;
            }, 0);

            debts[profile.id] = totalOwed;
        });

        return debts;
    }, [profiles, transactions]);

    // Fetch payments and calculate actual remaining debts
    const [actualDebts, setActualDebts] = useState({});

    useEffect(() => {
        const calculateActualDebts = async () => {
            const debtsWithPayments = {};

            for (const profile of profiles) {
                let totalRemaining = 0;

                for (const transaction of transactions) {
                    const share = transaction.shares?.find(s => s.profile_id === profile.id);

                    if (share && transaction.payer_id !== profile.id) {
                        // Fetch payments for this share
                        const payments = await fetchPaymentsForShare(share.transaction_id, share.profile_id);
                        const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                        const remaining = share.share_amount - totalPaid;

                        totalRemaining += Math.max(0, remaining);
                    }
                }

                debtsWithPayments[profile.id] = totalRemaining;
            }

            setActualDebts(debtsWithPayments);
        };

        if (profiles.length > 0 && transactions.length > 0) {
            calculateActualDebts();
        }
    }, [profiles, transactions, fetchPaymentsForShare]);

    return (
        <div className="container" style={{ paddingBottom: '80px' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                    Quem divide com você?
                </h1>
            </header>

            <form onSubmit={handleAdd} className="card" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                            className="input"
                            placeholder="Nome (ex: João, Mãe)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                        />
                        <input
                            className="input"
                            type="email"
                            placeholder="Email (opcional, para futuro acesso)"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
                        <Plus size={24} />
                    </button>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    * Adicione pessoas que dividem gastos com você. Se colocar o email, elas poderão criar conta futuramente.
                </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {profiles.map(profile => {
                    const debt = actualDebts[profile.id] || 0;
                    const hasDebt = debt > 0;

                    return (
                        <div
                            key={profile.id}
                            className="card"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px',
                                cursor: !profile.isOwner ? 'pointer' : 'default',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onClick={() => !profile.isOwner && navigate(`/profile/${profile.id}`)}
                            onMouseEnter={(e) => {
                                if (!profile.isOwner) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!profile.isOwner) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '';
                                }
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                <div style={{
                                    width: '40px', height: '40px',
                                    borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--primary)'
                                }}>
                                    <User size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{profile.name}</span>
                                        {profile.isOwner && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px' }}>Você</span>}
                                    </div>
                                    {!profile.isOwner && hasDebt && (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: '600', marginTop: '4px' }}>
                                            Deve: R$ {debt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    )}
                                    {!profile.isOwner && !hasDebt && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            Sem dívidas pendentes
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {!profile.isOwner && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Tem certeza que deseja remover ${profile.name}?`)) {
                                                    removeProfile(profile.id).catch(() => {
                                                        alert('Não foi possível remover este perfil. Ele pode estar vinculado a gastos existentes.');
                                                    });
                                                }
                                            }}
                                            style={{ color: 'var(--danger)', background: 'transparent', opacity: 0.7 }}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        <ChevronRight size={20} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
