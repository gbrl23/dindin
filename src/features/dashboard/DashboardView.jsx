import React, { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useProfiles } from '../../hooks/useProfiles';
import { useCards } from '../../hooks/useCards';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, TrendingUp, FileText, ArrowUp, ArrowDown, CheckCircle, Edit2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import CumulativeLineChart from '../../components/CumulativeLineChart';
import IncomeModal from './IncomeModal';
import { parseLocalDate, displayDate } from '../../utils/dateUtils';
import { useBalanceCalculator } from '../../hooks/useBalanceCalculator';

export default function DashboardView() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedDate, openTransactionModal } = useDashboard();

    const { transactions, fetchTransactions } = useTransactions();
    const { profiles, updateProfile, loading: loadingProfiles } = useProfiles();
    const { cards } = useCards();

    // UI state
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [balanceCardView, setBalanceCardView] = useState(0); // 0 = A Receber, 1 = A Pagar

    // Derived Data
    const myProfile = profiles.find(p => p.user_id === user?.id);
    const monthlyIncome = myProfile?.monthly_income; // Can be null, undefined, or number

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Onboarding Check
    useEffect(() => {
        if (!loadingProfiles && myProfile) {
            // If monthly_income is exactly null or undefined (not 0), open modal
            if (monthlyIncome === null || monthlyIncome === undefined) {
                setIsIncomeModalOpen(true);
            }
        }
    }, [loadingProfiles, myProfile, monthlyIncome]);

    // --- CALCULATIONS ---
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();

    const isSelectedMonth = (tx) => {
        // Priority: Invoice Date (Card) > Competence Date > Transaction Date
        let dateToUse = tx.date;
        if (tx.type === 'expense' && tx.card_id && tx.invoice_date) {
            dateToUse = tx.invoice_date;
        } else if (tx.competence_date) {
            dateToUse = tx.competence_date;
        }

        const d = parseLocalDate(dateToUse);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    };

    const monthlyTransactions = transactions.filter(t => isSelectedMonth(t));

    // Totals (Income only - expenses calculated by hook)
    const totalIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    // --- Balance Calculator (Divisões) ---
    // myExpenses = apenas minha parte das despesas (considera divisões)
    const { myExpenses, totalAReceber, totalAPagar, netBalance } = useBalanceCalculator(
        transactions,
        myProfile?.id,
        selectedDate
    );

    // Saldo Líquido = Salário + Receitas - Minha Parte das Despesas
    // Nota: netBalance (A Receber - A Pagar) NÃO entra aqui porque:
    // - Se eu paguei R$50 e tenho R$25 a receber → myExpenses já é R$25 (minha parte)
    // - O A Receber é informativo, não afeta o saldo diretamente
    const balance = ((parseFloat(monthlyIncome) || 0) + totalIncome) - myExpenses;

    const cardInvoices = cards.map(c => {
        const cardTotal = transactions
            .filter(t => t.card_id === c.id && t.type === 'expense')
            .filter(t => isSelectedMonth(t))
            .reduce((acc, t) => acc + t.amount, 0);
        return { ...c, total: cardTotal };
    });

    // Chart Data Preparation (CUMULATIVE)
    const { incomeData, expenseData, labels } = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const labels = [];
        const incData = [];
        const expData = [];

        // Cumulative trackers
        let cumIncome = 0;
        let cumExpense = 0;

        for (let i = 1; i <= daysInMonth; i++) {
            labels.push(i.toString());

            // Sum expenses for this day
            const dayExpenses = monthlyTransactions
                .filter(t => t.type !== 'income')
                .filter(t => parseLocalDate(t.date).getDate() === i)
                .reduce((acc, t) => acc + t.amount, 0);

            const dayIncome = monthlyTransactions
                .filter(t => t.type === 'income')
                .filter(t => parseLocalDate(t.date).getDate() === i)
                .reduce((acc, t) => acc + t.amount, 0);

            cumIncome += dayIncome;
            cumExpense += dayExpenses;

            incData.push(cumIncome);
            expData.push(cumExpense);
        }
        return { incomeData: incData, expenseData: expData, labels };
    }, [monthlyTransactions, selectedYear, selectedMonth]);

    const handleUpdateIncome = async (amount) => {
        if (!myProfile) return;
        await updateProfile(myProfile.id, { monthly_income: amount });
    };

    return (
        // Added marginTop: '32px' to give breathing room from sticky header
        <div style={{
            display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '32px', paddingBottom: '40px',
            marginTop: '24px'
        }} className="animate-fade-in">

            {/* LEFT COLUMN (Main) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* 1. Summary Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>

                    {/* Balance (Clickable to Edit Income) */}
                    <div className="card hover-scale"
                        onClick={() => setIsIncomeModalOpen(true)}
                        style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--primary)', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(81, 0, 255, 0.1)', color: 'var(--primary)' }}>
                                    <Wallet size={20} />
                                </div>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>Saldo Previsto</span>
                            </div>
                            <Edit2 size={16} color="var(--text-tertiary)" />
                        </div>
                        <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {monthlyIncome > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Base: R$ {monthlyIncome.toLocaleString('pt-BR')} (Salário)
                            </div>
                        )}
                    </div>

                    {/* Income */}
                    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--success)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(52, 199, 89, 0.1)', color: 'var(--success)' }}>
                                <ArrowUp size={20} />
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>Receitas Extras</span>
                        </div>
                        <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                            R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Expenses - Minha Parte */}
                    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--danger)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(255, 59, 48, 0.1)', color: 'var(--danger)' }}>
                                <ArrowDown size={20} />
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>Minhas Despesas</span>
                        </div>
                        <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                            R$ {myExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Divisões Card - 3 views: Balanço, A Receber, A Transferir */}
                {(totalAReceber > 0 || totalAPagar > 0) && (() => {
                    // View 0 = Balanço (NET), View 1 = A Receber, View 2 = A Transferir
                    const views = [
                        {
                            title: 'Balanço das Divisões',
                            value: netBalance,
                            color: netBalance >= 0 ? 'var(--success)' : 'var(--warning)',
                            prefix: netBalance >= 0 ? '+' : '',
                            subtitle: netBalance >= 0 ? 'Você ganha com as divisões' : 'Você deve das divisões'
                        },
                        {
                            title: 'A Receber',
                            value: totalAReceber,
                            color: 'var(--success)',
                            prefix: '+',
                            subtitle: 'De despesas que você pagou'
                        },
                        {
                            title: 'A Transferir',
                            value: totalAPagar,
                            color: 'var(--warning)',
                            prefix: '-',
                            subtitle: 'Para quem pagou por você'
                        }
                    ];
                    const current = views[balanceCardView];
                    const nextView = () => setBalanceCardView(v => (v + 1) % 3);
                    const prevView = () => setBalanceCardView(v => (v + 2) % 3);

                    return (
                        <div
                            className="card"
                            style={{
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'var(--bg-card)',
                                borderLeft: `4px solid ${current.color}`,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <button
                                onClick={prevView}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    marginBottom: '4px'
                                }}>
                                    <Users size={16} color={current.color} />
                                    <span style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {current.title}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: current.color,
                                    letterSpacing: '-0.5px'
                                }}>
                                    {current.prefix}R$ {Math.abs(current.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                    {current.subtitle}
                                </div>
                                {/* Dots indicator */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                                    {[0, 1, 2].map(i => (
                                        <div
                                            key={i}
                                            onClick={() => setBalanceCardView(i)}
                                            style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: balanceCardView === i ? current.color : 'var(--border)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={nextView}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    );
                })()}

                {/* 2. Chart Section (Updated) */}
                <div className="card" style={{ padding: '24px', minHeight: '320px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={20} /> Fluxo Financeiro (Acumulado)
                        </h3>
                        {/* Legend Updated Colors */}
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, background: '#5100FF', borderRadius: '2px' }} /> Receitas</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, background: '#1D1D1F', borderRadius: '2px' }} /> Despesas</div>
                        </div>
                    </div>

                    <CumulativeLineChart
                        incomeData={incomeData}
                        expenseData={expenseData}
                        labels={labels}
                        height={240}
                    />
                </div>

                {/* 3. Detailed Statement */}
                <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Extrato Recente</h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                            <thead style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    <th style={{ padding: '16px 32px', fontWeight: '600', width: '60px' }}>Icon</th>
                                    <th style={{ padding: '16px 16px', fontWeight: '600' }}>Data</th>
                                    <th style={{ padding: '16px 16px', fontWeight: '600' }}>Descrição</th>
                                    <th style={{ padding: '16px 16px', fontWeight: '600' }}>Método</th>
                                    <th style={{ padding: '16px 32px', fontWeight: '600', textAlign: 'right' }}>Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            Nenhum lançamento neste mês.
                                        </td>
                                    </tr>
                                ) : (
                                    monthlyTransactions.slice(0, 10).map(t => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                                            <td style={{ padding: '16px 32px' }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: '12px',
                                                    background: t.category_details ? `${t.category_details.color}20` : 'var(--bg-primary)',
                                                    color: t.category_details ? t.category_details.color : 'inherit',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: t.category_details ? '1.2rem' : '1rem'
                                                }}>
                                                    {t.category_details ? t.category_details.icon :
                                                        (t.type === 'income' ? <ArrowUp size={18} color="var(--success)" /> :
                                                            t.type === 'investment' ? <TrendingUp size={18} color="var(--info)" /> :
                                                                <ArrowDown size={18} color="var(--danger)" />)
                                                    }
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                                {displayDate(t.date, { day: '2-digit', month: 'short' })}
                                            </td>
                                            <td style={{ padding: '16px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>{t.description}</td>
                                            <td style={{ padding: '16px 16px', color: 'var(--text-secondary)' }}>{t.card?.name || 'Conta'}</td>
                                            <td style={{ padding: '16px 32px', textAlign: 'right', fontWeight: '700', color: t.type === 'income' ? 'var(--success)' : 'var(--text-primary)' }}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN (Sidebar) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Credit Cards Widget */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={18} /> Meus Cartões
                        </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {cardInvoices.length === 0 ? (
                            <div className="card" style={{ padding: '32px', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nenhum cartão</p>
                            </div>
                        ) : (
                            cardInvoices.map(card => (
                                <div key={card.id} className="card" style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={() => navigate(`/card-invoice/${card.id}`)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <CreditCard size={20} color="var(--primary)" />
                                            <span style={{ fontWeight: '600' }}>{card.name}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Fatura atual</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>R$ {card.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Upcoming Bills Widget */}
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <FileText size={18} /> Contas Próximas
                    </h3>
                    <div className="card" style={{ padding: '32px', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
                        <div style={{ width: 48, height: 48, background: 'rgba(52, 199, 89, 0.1)', borderRadius: '50%', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                            <CheckCircle size={24} />
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nada pendente</p>
                    </div>
                </div>
            </div>

            <IncomeModal
                isOpen={isIncomeModalOpen}
                onClose={() => setIsIncomeModalOpen(false)}
                onSave={handleUpdateIncome}
                currentIncome={monthlyIncome}
            />

        </div>
    );
}
