import React from 'react';
import { displayDate, formatLocalDate } from '../../../utils/dateUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Calendar, TrendingUp, FileText } from 'lucide-react';

export default function DayTransactionList({ date, data }) {
    if (!data) return (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <p>Selecione um dia para ver os detalhes.</p>
        </div>
    );

    const { transactions, events } = data;
    const hasItems = transactions.length > 0 || events.length > 0;

    const getTransactionStyle = (type) => {
        switch (type) {
            case 'income': return { color: 'var(--success)', bg: 'rgba(52, 199, 89, 0.1)', icon: <ArrowDownLeft size={18} /> };
            case 'expense': return { color: 'var(--danger)', bg: 'rgba(255, 59, 48, 0.1)', icon: <ArrowUpRight size={18} /> };
            case 'bill': return { color: 'var(--warning)', bg: 'rgba(255, 149, 0, 0.1)', icon: <FileText size={18} /> };
            case 'investment': return { color: 'var(--info)', bg: 'rgba(0, 122, 255, 0.1)', icon: <TrendingUp size={18} /> };
            default: return { color: 'var(--text-secondary)', bg: 'rgba(0,0,0,0.05)', icon: <ArrowUpRight size={18} /> };
        }
    };

    return (
        <div style={{
            flex: 1,
            background: 'var(--bg-card)',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
            padding: '24px 16px 80px 16px',
            overflowY: 'auto'
        }}>
            <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '16px'
            }}>
                {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>

            {!hasItems && (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '0.875rem' }}>Nenhuma movimentação neste dia.</p>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Events (Closing/Due) */}
                {events.map((evt, idx) => (
                    <div key={`evt-${idx}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(134, 134, 139, 0.1)', // Neutral/Gray background for system events
                        border: '1px solid rgba(134, 134, 139, 0.2)'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(134, 134, 139, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)'
                        }}>
                            {evt.type === 'closing' ? <CreditCard size={18} /> : <Calendar size={18} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{evt.title}</span>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                                {evt.type === 'closing' ? 'Melhor dia de compra' : 'Vencimento da fatura'}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Transactions */}
                {transactions.map(tx => {
                    const style = getTransactionStyle(tx.type);
                    return (
                        <div key={tx.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            borderRadius: '16px',
                            background: 'var(--bg-primary)',
                            border: '1px solid transparent',
                            transition: 'all 0.2s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: style.bg,
                                    color: style.color
                                }}>
                                    {style.icon}
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{tx.description}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{tx.category}</p>
                                </div>
                            </div>
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                color: style.color
                            }}>
                                {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
