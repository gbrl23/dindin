import React, { useState, useMemo, useEffect } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useProfiles } from '../../hooks/useProfiles';
import { useSharePayments } from '../../hooks/useSharePayments';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, CheckCircle, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';
import PaymentModal from '../../components/PaymentModal';
import EditPaymentModal from '../../components/EditPaymentModal';

export default function ProfileDetailsView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { profiles, updateProfile } = useProfiles();
    const { transactions, fetchTransactions } = useTransactions();
    const { fetchPaymentsForShare, addPayment, updatePayment, removePayment } = useSharePayments();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const profile = profiles.find(p => p.id === id);

    // State for filter
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // State for payments
    const [sharePayments, setSharePayments] = useState({});
    const [selectedShare, setSelectedShare] = useState(null);
    const [editingPayment, setEditingPayment] = useState(null);
    const [expandedTransactions, setExpandedTransactions] = useState({});

    // Fetch transactions on mount
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Fetch payments for all shares
    useEffect(() => {
        const loadPayments = async () => {
            const paymentsMap = {};
            for (const t of transactions) {
                if (t.shares) {
                    for (const share of t.shares) {
                        if (share.profile_id === id) {
                            const payments = await fetchPaymentsForShare(share.transaction_id, share.profile_id);
                            const shareKey = `${share.transaction_id}_${share.profile_id}`;
                            paymentsMap[shareKey] = payments;
                        }
                    }
                }
            }
            setSharePayments(paymentsMap);
        };

        if (transactions.length > 0) {
            loadPayments();
        }
    }, [transactions, id, fetchPaymentsForShare]);

    // 1. Get all transactions for this profile with payment info
    const profileTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.shares && t.shares.some(s => s.profile_id === id)
        ).map(t => {
            const splitDetail = t.shares.find(s => s.profile_id === id);
            const shareKey = `${splitDetail?.transaction_id}_${splitDetail?.profile_id}`;
            const payments = sharePayments[shareKey] || [];
            const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
            const shareAmount = splitDetail ? splitDetail.share_amount : 0;

            return {
                ...t,
                share: {
                    ...splitDetail,
                    transaction_id: t.id  // Add transaction_id from parent transaction
                },
                myShare: shareAmount,
                totalPaid,
                remainingBalance: shareAmount - totalPaid,
                payments
            };
        });
    }, [transactions, id, sharePayments]);

    // 2. Extract available months
    const availableMonths = useMemo(() => {
        const months = new Set(profileTransactions.map(t => t.date.slice(0, 7)));
        return Array.from(months).sort().reverse();
    }, [profileTransactions]);

    // 3. Filter by selected month
    const currentMonthTransactions = profileTransactions.filter(t => t.date.startsWith(selectedMonth));

    const totalShareMonth = currentMonthTransactions.reduce((acc, t) => acc + t.remainingBalance, 0);

    if (!profile) return <div className="container" style={{ paddingTop: 40 }}>Perfil não encontrado.</div>;

    const formatMonth = (isoMonth) => {
        const [year, month] = isoMonth.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    }

    const handlePaymentSubmit = async (paymentData) => {
        try {
            await addPayment(paymentData.transactionId, paymentData.profileId, paymentData.amount, paymentData.paymentDate, paymentData.notes);

            // Refresh payments
            const payments = await fetchPaymentsForShare(paymentData.transactionId, paymentData.profileId);
            const shareKey = `${paymentData.transactionId}_${paymentData.profileId}`;
            setSharePayments(prev => ({
                ...prev,
                [shareKey]: payments
            }));

            // Force refresh of all transactions to update UI
            await fetchTransactions();

            // Reload page to show updated values
            window.location.reload();
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Erro ao registrar pagamento');
        }
    };

    const handleEditPaymentSubmit = async (paymentData) => {
        try {
            await updatePayment(
                editingPayment.id,
                paymentData.amount,
                paymentData.paymentDate,
                paymentData.notes
            );

            // Refresh payments
            const payments = await fetchPaymentsForShare(
                editingPayment.transaction_id,
                editingPayment.profile_id
            );
            const shareKey = `${editingPayment.transaction_id}_${editingPayment.profile_id}`;
            setSharePayments(prev => ({
                ...prev,
                [shareKey]: payments
            }));

            await fetchTransactions();
            setEditingPayment(null);
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Erro ao atualizar pagamento');
        }
    };

    const handleDeletePayment = async (payment, transactionId, profileId) => {
        if (!confirm('Tem certeza que deseja excluir este pagamento?')) return;

        try {
            await removePayment(payment.id);

            // Refresh payments
            const payments = await fetchPaymentsForShare(transactionId, profileId);
            const shareKey = `${transactionId}_${profileId}`;
            setSharePayments(prev => ({
                ...prev,
                [shareKey]: payments
            }));

            await fetchTransactions();
        } catch (error) {
            console.error('Error deleting payment:', error);
            alert('Erro ao excluir pagamento');
        }
    };

    const toggleTransactionExpanded = (transactionId) => {
        setExpandedTransactions(prev => ({
            ...prev,
            [transactionId]: !prev[transactionId]
        }));
    };

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
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '2px' }}>
                        {profile.name}
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Detalhes e Gastos Individuais
                    </p>
                </div>
                {profile.isOwner && (
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        style={{
                            padding: '10px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                        }}
                    >
                        <Edit2 size={16} /> Configurar
                    </button>
                )}
            </header>

            {/* Settings Area */}
            {isSettingsOpen && profile.isOwner && (
                <div className="card animate-fade-in" style={{ padding: '16px', marginBottom: '24px', border: '1px solid var(--primary)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Configurações do Perfil</h3>
                    <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                            Dia de Início do Mês Financeiro
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={profile.financial_start_day || 1}
                                onChange={async (e) => {
                                    const val = parseInt(e.target.value);
                                    if (val >= 1 && val <= 31) {
                                        await updateProfile(profile.id, { financial_start_day: val });
                                    }
                                }}
                                style={{ width: '60px', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                (Receitas a partir deste dia contarão para o mês seguinte)
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Section */}
            <div className="card" style={{
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                    <Calendar size={18} />
                    <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Mês de Referência:</span>
                </div>
                <select
                    className="input"
                    style={{
                        width: 'auto',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontWeight: '600'
                    }}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                >
                    {availableMonths.length > 0 ? (
                        availableMonths.map(m => (
                            <option key={m} value={m} style={{ textTransform: 'capitalize' }}>
                                {formatMonth(m)}
                            </option>
                        ))
                    ) : (
                        <option value={selectedMonth}>{formatMonth(selectedMonth)}</option>
                    )}
                </select>
            </div>

            {/* Premium Summary Card (Amber for Debt) */}
            <div className="card" style={{
                padding: '24px',
                marginBottom: '32px',
                background: totalShareMonth > 0 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                boxShadow: totalShareMonth > 0 ? '0 10px 30px rgba(245, 158, 11, 0.3)' : '0 10px 30px rgba(16, 185, 129, 0.2)',
                border: 'none',
                borderRadius: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', opacity: 0.9 }}>
                    <DollarSign size={20} />
                    <span style={{ fontSize: '1rem', fontWeight: '500' }}>
                        {totalShareMonth > 0 ? `Total em aberto em ${formatMonth(selectedMonth)}` : 'Tudo pago neste mês!'}
                    </span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                    R$ {totalShareMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px' }}>
                    {currentMonthTransactions.length} {currentMonthTransactions.length === 1 ? 'gasto compartilhado' : 'gastos compartilhados'} no período
                </div>
            </div>

            {/* Transactions List */}
            <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>Histórico</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {currentMonthTransactions.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                            Nenhum gasto neste mês.
                        </div>
                    ) : (
                        currentMonthTransactions.map(t => {
                            const isPaid = t.remainingBalance <= 0;
                            const paymentProgress = t.myShare > 0 ? (t.totalPaid / t.myShare) * 100 : 0;
                            const isExpanded = expandedTransactions[t.id];

                            return (
                                <div key={t.id} className="card hover-scale" style={{
                                    padding: '20px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-card)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{t.description}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={14} />
                                                {new Date(t.date).toLocaleDateString('pt-BR')}
                                                {t.card?.name && ` • ${t.card.name}`}
                                            </div>
                                            {t.payer?.full_name && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--primary)',
                                                    marginTop: '8px',
                                                    background: 'rgba(81, 0, 255, 0.05)',
                                                    padding: '2px 10px',
                                                    borderRadius: '20px',
                                                    display: 'inline-block',
                                                    fontWeight: '600'
                                                }}>
                                                    Pago por {t.payer.full_name}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: '800', fontSize: '1.2rem', color: isPaid ? 'var(--success)' : 'var(--warning)' }}>
                                                R$ {t.remainingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                                de R$ {t.myShare.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Progress Bar */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: '600' }}>{isPaid ? 'Totalmente Pago' : `${paymentProgress.toFixed(0)}% concluído`}</span>
                                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>R$ {t.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pago</span>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '10px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${Math.min(paymentProgress, 100)}%`,
                                                height: '100%',
                                                background: isPaid ? 'var(--success)' : 'linear-gradient(90deg, var(--primary) 0%, #6366f1 100%)',
                                                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                borderRadius: '10px'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {!isPaid && (
                                            <button
                                                onClick={() => {
                                                    const shareData = { ...t.share, transaction: t, remainingBalance: t.remainingBalance };
                                                    setSelectedShare(shareData);
                                                }}
                                                className="btn btn-primary"
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 16px',
                                                    fontSize: '0.9rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    borderRadius: '12px',
                                                    fontWeight: '700'
                                                }}
                                            >
                                                <DollarSign size={18} />
                                                Registrar Pagamento
                                            </button>
                                        )}
                                        {t.payments && t.payments.length > 0 && (
                                            <button
                                                onClick={() => toggleTransactionExpanded(t.id)}
                                                style={{
                                                    flex: isPaid ? 1 : 0,
                                                    padding: '10px 16px',
                                                    fontSize: '0.85rem',
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                {t.payments.length} {t.payments.length === 1 ? 'Lançamento' : 'Lançamentos'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Payment History (Collapsible) */}
                                    {isExpanded && t.payments && t.payments.length > 0 && (
                                        <div style={{
                                            marginTop: '12px',
                                            paddingTop: '12px',
                                            borderTop: '1px solid var(--border)'
                                        }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                                Histórico de Pagamentos
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {t.payments.map(payment => (
                                                    <div
                                                        key={payment.id}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '8px 12px',
                                                            background: 'var(--bg-secondary)',
                                                            borderRadius: '6px',
                                                            fontSize: '0.8rem',
                                                            gap: '12px'
                                                        }}
                                                    >
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                                                                <span>{new Date(payment.payment_date).toLocaleDateString('pt-BR')}</span>
                                                            </div>
                                                            {payment.notes && (
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', marginLeft: '20px' }}>
                                                                    {payment.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ fontWeight: '600', color: 'var(--success)' }}>
                                                                R$ {parseFloat(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                <button
                                                                    onClick={() => setEditingPayment({ ...payment, transaction_id: t.id, profile_id: id })}
                                                                    style={{
                                                                        background: 'transparent',
                                                                        border: 'none',
                                                                        color: 'var(--primary)',
                                                                        cursor: 'pointer',
                                                                        padding: '4px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        borderRadius: '4px',
                                                                        transition: 'background 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                    title="Editar pagamento"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePayment(payment, t.id, id)}
                                                                    style={{
                                                                        background: 'transparent',
                                                                        border: 'none',
                                                                        color: 'var(--danger)',
                                                                        cursor: 'pointer',
                                                                        padding: '4px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        borderRadius: '4px',
                                                                        transition: 'background 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                    title="Excluir pagamento"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {selectedShare && (
                <PaymentModal
                    share={selectedShare}
                    onClose={() => setSelectedShare(null)}
                    onSubmit={handlePaymentSubmit}
                />
            )}

            {/* Edit Payment Modal */}
            {editingPayment && (
                <EditPaymentModal
                    payment={editingPayment}
                    share={currentMonthTransactions.find(t => t.id === editingPayment.transaction_id)}
                    onClose={() => setEditingPayment(null)}
                    onSubmit={handleEditPaymentSubmit}
                />
            )}
        </div>
    );
}
