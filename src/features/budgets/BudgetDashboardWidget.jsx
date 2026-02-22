import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useTransactions } from '../../hooks/useTransactions';
import { useBudgets, getBudgetsWithProgress } from '../../hooks/useBudgets';
import BudgetProgressBar from './BudgetProgressBar';

const formatCurrency = (value) =>
    Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function BudgetDashboardWidget() {
    const navigate = useNavigate();
    const { selectedDate } = useDashboard();
    const { transactions } = useTransactions();
    const { budgets, fetchBudgets } = useBudgets();

    const currentMonth = useMemo(() => {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }, [selectedDate]);

    useEffect(() => {
        fetchBudgets(currentMonth);
    }, [fetchBudgets, currentMonth]);

    const budgetsWithProgress = useMemo(
        () => getBudgetsWithProgress(budgets, transactions, currentMonth),
        [budgets, transactions, currentMonth]
    );

    // Show top 3 budgets sorted by percentage (highest first)
    const topBudgets = useMemo(
        () => [...budgetsWithProgress].sort((a, b) => b.percentage - a.percentage).slice(0, 3),
        [budgetsWithProgress]
    );

    if (topBudgets.length === 0) return null;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={18} /> Orçamentos
                </h3>
                <button
                    onClick={() => navigate('/budgets')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                    Ver todos
                </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topBudgets.map(budget => (
                    <div
                        key={budget.id}
                        className="card"
                        onClick={() => navigate('/budgets')}
                        style={{ padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: 16 }}>{budget.category?.icon || '📦'}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{budget.category?.name || 'Categoria'}</span>
                            </div>
                            <span style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: budget.status === 'exceeded' || budget.status === 'critical' ? '#FF3B30'
                                    : budget.status === 'warning' ? '#FF9500'
                                        : '#34C759'
                            }}>
                                {budget.percentage}%
                            </span>
                        </div>
                        <BudgetProgressBar percentage={budget.percentage} status={budget.status} />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {formatCurrency(budget.spent)} de {formatCurrency(budget.amount)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
