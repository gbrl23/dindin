import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Target } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useBudgets, getBudgetsWithProgress } from '../../hooks/useBudgets';
import BudgetCard from './BudgetCard';
import BudgetFormModal from './BudgetFormModal';

export default function BudgetsView() {
    const { selectedDate } = useDashboard();
    const { transactions } = useTransactions();
    const { categories } = useCategories();
    const { budgets, loading, fetchBudgets, addBudget, updateBudget, removeBudget, checkBudgetThresholds } = useBudgets();

    const [showModal, setShowModal] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);

    // Current month as YYYY-MM for budget queries
    const currentMonth = useMemo(() => {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }, [selectedDate]);

    // Fetch budgets when month changes
    useEffect(() => {
        fetchBudgets(currentMonth);
    }, [fetchBudgets, currentMonth]);

    // Enrich budgets with progress data
    const budgetsWithProgress = useMemo(
        () => getBudgetsWithProgress(budgets, transactions, currentMonth),
        [budgets, transactions, currentMonth]
    );

    // Check budget thresholds for notifications
    useEffect(() => {
        if (budgetsWithProgress.length > 0) {
            checkBudgetThresholds(budgetsWithProgress, currentMonth);
        }
    }, [budgetsWithProgress, currentMonth, checkBudgetThresholds]);

    // IDs of categories that already have a budget this month
    const existingBudgetCategoryIds = useMemo(
        () => budgets.map(b => b.category_id),
        [budgets]
    );

    const handleSave = async ({ categoryId, amount, isEditing, budgetId }) => {
        try {
            if (isEditing) {
                await updateBudget(budgetId, amount);
            } else {
                await addBudget(categoryId, amount, currentMonth);
            }
        } catch (err) {
            console.error('Error saving budget:', err);
            alert('Erro ao salvar orçamento: ' + err.message);
        }
    };

    const handleEdit = (budget) => {
        setEditingBudget(budget);
        setShowModal(true);
    };

    const handleRemove = async (id) => {
        if (window.confirm('Excluir este orçamento?')) {
            try {
                if (navigator.vibrate) navigator.vibrate(10);
                await removeBudget(id);
            } catch (err) {
                console.error('Error removing budget:', err);
                alert('Erro ao excluir orçamento: ' + err.message);
            }
        }
    };

    const handleOpenAdd = () => {
        setEditingBudget(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingBudget(null);
    };

    const currentMonthLabel = selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // Summary stats
    const summary = useMemo(() => {
        const totalLimit = budgetsWithProgress.reduce((sum, b) => sum + b.amount, 0);
        const totalSpent = budgetsWithProgress.reduce((sum, b) => sum + b.spent, 0);
        const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
        return { totalLimit, totalSpent, overallPercentage };
    }, [budgetsWithProgress]);

    const formatCurrency = (value) =>
        Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '100px', marginTop: '24px' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>
                    Orçamentos
                </h1>
                <button
                    onClick={handleOpenAdd}
                    style={{
                        background: 'var(--text-primary)', color: '#FFF', border: 'none',
                        padding: '10px 20px', borderRadius: '24px', fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                >
                    <Plus size={18} />
                    <span style={{ fontSize: '0.9rem' }}>Novo</span>
                </button>
            </header>

            {/* Summary Card */}
            {budgetsWithProgress.length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 20,
                    padding: '20px',
                    marginBottom: '24px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                            RESUMO {currentMonthLabel.toUpperCase()}
                        </span>
                        <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: summary.overallPercentage >= 100 ? '#FF3B30'
                                : summary.overallPercentage >= 75 ? '#FF9500'
                                    : '#34C759'
                        }}>
                            {summary.overallPercentage}%
                        </span>
                    </div>
                    {/* Overall progress bar */}
                    <div style={{
                        width: '100%', height: 8, backgroundColor: '#f0f0f0',
                        borderRadius: 4, overflow: 'hidden', marginBottom: 12,
                    }}>
                        <div style={{
                            width: `${Math.min(summary.overallPercentage, 100)}%`,
                            height: '100%',
                            backgroundColor: summary.overallPercentage >= 100 ? '#FF3B30'
                                : summary.overallPercentage >= 75 ? '#FF9500'
                                    : '#34C759',
                            borderRadius: 4,
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                        <span>Gasto: {formatCurrency(summary.totalSpent)}</span>
                        <span>Limite: {formatCurrency(summary.totalLimit)}</span>
                    </div>
                </div>
            )}

            {/* Budget Cards */}
            {loading && budgets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Carregando...
                </div>
            ) : budgetsWithProgress.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                }}>
                    <Target size={48} strokeWidth={1.5} color="var(--text-secondary)" />
                    <div>
                        <p style={{ fontWeight: 600, fontSize: 16, margin: '0 0 4px' }}>Nenhum orçamento definido</p>
                        <p style={{ fontSize: 14, margin: 0 }}>
                            Crie orçamentos para controlar seus gastos em {currentMonthLabel}.
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {budgetsWithProgress.map(budget => (
                        <BudgetCard
                            key={budget.id}
                            budget={budget}
                            onEdit={handleEdit}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <BudgetFormModal
                isOpen={showModal}
                onClose={handleCloseModal}
                onSave={handleSave}
                categories={categories}
                existingBudgetIds={existingBudgetCategoryIds}
                editingBudget={editingBudget}
            />
        </div>
    );
}
