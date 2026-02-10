import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CreditCard,
    Calendar,
    Plus,
    ChevronRight,
    ArrowLeft,
    Zap,
    Clock,
    AlertCircle,
    TrendingUp,
    Tv,
    Music,
    Globe,
    Scissors
} from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useDashboard } from '../../contexts/DashboardContext';
import DindinTip from '../../components/common/DindinTip';

export default function SubscriptionsView() {
    const navigate = useNavigate();
    const { transactions } = useTransactions();
    const { openTransactionModal } = useDashboard();

    // Filter only recurring transactions (subscriptions)
    const subscriptions = useMemo(() => {
        // We consider subscription anything that has series_id and is an ongoing expense
        // OR has 'assinatura' in category/description
        return transactions.filter(t =>
            t.type === 'expense' &&
            t.series_id &&
            !t.description.includes('/') // Not an installment
        ).reduce((acc, current) => {
            // Group by series_id to show only one entry per subscription
            const x = acc.find(item => item.series_id === current.series_id);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);
    }, [transactions]);

    const totalMonthly = useMemo(() => {
        return subscriptions.reduce((acc, sub) => acc + sub.amount, 0);
    }, [subscriptions]);

    const getAppIcon = (description) => {
        const desc = description.toLowerCase();
        if (desc.includes('netflix') || desc.includes('hbo') || desc.includes('prime') || desc.includes('disney')) return <Tv size={20} />;
        if (desc.includes('spotify') || desc.includes('deezer') || desc.includes('music')) return <Music size={20} />;
        if (desc.includes('icloud') || desc.includes('google') || desc.includes('cloud')) return <Globe size={20} />;
        return <Zap size={20} />;
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '40px',
                marginTop: '20px'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '10px',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '4px' }}>
                        Hub de Assinaturas
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Gerencie seus custos fixos e serviços recorrentes
                    </p>
                </div>
            </header>

            {/* Overview Card */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #7000FF 100%)',
                padding: '32px',
                borderRadius: '24px',
                color: '#fff',
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 20px 40px rgba(81, 0, 255, 0.2)'
            }}>
                <div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '8px', fontWeight: '500' }}>
                        Total Mensal Estimado
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
                        R$ {totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '0.85rem', opacity: 0.9 }}>
                        <AlertCircle size={14} />
                        <span>Baseado em {subscriptions.length} serviços ativos</span>
                    </div>
                </div>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                }}>
                    <TrendingUp size={40} />
                </div>
            </div>

            {/* Actions */}
            <div style={{ marginBottom: '32px' }}>
                <button
                    onClick={() => openTransactionModal('expense')}
                    className="btn btn-primary"
                    style={{
                        padding: '16px 24px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '1rem',
                        fontWeight: '700',
                        width: '100%',
                        justifyContent: 'center'
                    }}
                >
                    <Plus size={20} />
                    Adicionar Nova Assinatura
                </button>
            </div>

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {subscriptions.length === 0 ? (
                    <div className="card" style={{
                        gridColumn: '1 / -1',
                        padding: '60px 20px',
                        textAlign: 'center',
                        borderStyle: 'dashed',
                        background: 'transparent'
                    }}>
                        <Tv size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px', opacity: 0.5 }} />
                        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Nenhuma assinatura detectada</h3>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                            Adicione transações recorrentes para vê-las aqui.
                        </p>
                    </div>
                ) : (
                    subscriptions.map(sub => (
                        <div key={sub.id} className="card hover-scale" style={{
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            cursor: 'pointer'
                        }} onClick={() => navigate(`/edit-transaction/${sub.id}`)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '14px',
                                    background: 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--primary)'
                                }}>
                                    {getAppIcon(sub.description)}
                                </div>
                                <div style={{
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    background: 'rgba(52, 199, 89, 0.1)',
                                    color: 'var(--success)',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase'
                                }}>
                                    Ativo
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>{sub.description}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <Clock size={14} />
                                    <span>Próxima cobrança mensal</span>
                                </div>
                            </div>

                            <div style={{
                                paddingTop: '16px',
                                borderTop: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                    R$ {sub.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <ChevronRight size={18} color="var(--text-tertiary)" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Quick Tips */}
            <DindinTip category="subscriptions" style={{ marginTop: '40px' }} />
        </div>
    );
}
