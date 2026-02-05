import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useAuth } from '../../contexts/AuthContext';
import { useProfiles } from '../../hooks/useProfiles';
import { useGoals } from '../../hooks/useGoals';
import { useNavigate } from 'react-router-dom';
import { Trash2, Search, Calendar, Filter, Plus, Edit2, TrendingUp, PiggyBank, Target } from 'lucide-react';
import GoalsSection from './GoalsSection';
import AddGoalModal from './AddGoalModal';
import GoalDetailModal from './GoalDetailModal';

export default function InvestmentsView() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profiles } = useProfiles();
    const { transactions, addTransaction, removeTransaction, fetchTransactions } = useTransactions();
    const { goals, addGoal, deleteGoal, fetchGoals, loading: loadingGoals } = useGoals();

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const filteredTransactions = (transactions || [])
        .filter(t => t?.type === 'investment')
        .filter(t =>
            (t?.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t?.date && new Date(t.date).toLocaleDateString('pt-BR').includes(searchTerm))
        ).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort DESC by date

    // Group by month
    const grouped = filteredTransactions.reduce((acc, t) => {
        const monthYear = new Date(t.date).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(t);
        return acc;
    }, {});

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja apagar este investimento?')) {
            await removeTransaction(id);
        }
    }

    const handleGoalClick = (goal) => {
        setSelectedGoal(goal);
    };

    const handleGoalDeleted = async (goalId) => {
        await deleteGoal(goalId);
        // Refresh data
        await fetchGoals();
        await fetchTransactions();
    };

    const totalInvested = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);

    // Find goal name for a transaction
    const getGoalName = (goalId) => {
        if (!goalId) return null;
        const goal = goals.find(g => g.id === goalId);
        return goal?.name || null;
    };

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '100px', marginTop: '24px' }}>

            {/* Header */}
            <header style={{ marginBottom: '32px' }}>
                <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 4px 0' }}>
                    Investimentos
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                    Acompanhe seu patrimônio e metas
                </p>
            </header>


            {/* Total Balance Card */}
            <div className="card" style={{
                padding: '24px', marginBottom: '32px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
                color: 'white',
                boxShadow: '0 10px 30px rgba(81, 0, 255, 0.3)',
                border: 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', opacity: 0.9 }}>
                    <PiggyBank size={20} color="white" />
                    <span style={{ fontSize: '1rem', fontWeight: '500' }}>Patrimônio Total</span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                    R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px' }}>
                    +R$ {filteredTransactions.length > 0 ? filteredTransactions[0].amount.toLocaleString('pt-BR') : '0,00'} este mês
                </div>
            </div>

            {/* Goals Section */}
            <GoalsSection
                goals={goals}
                onAddClick={() => setIsAddGoalOpen(true)}
                onGoalClick={handleGoalClick}
            />

            {/* Actions & Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Extrato</h2>
                <button
                    onClick={() => navigate('/add-transaction?type=investment')}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', borderRadius: '16px', fontSize: '0.9rem' }}
                >
                    <Plus size={18} style={{ marginRight: '6px' }} />
                    Novo Aporte
                </button>
            </div>

            {/* List */}
            {Object.keys(grouped).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '20px' }}>
                    <TrendingUp size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                    <p>Nenhum investimento registrado.</p>
                </div>
            ) : Object.keys(grouped).map(month => (
                <div key={month} style={{ marginBottom: '24px' }}>
                    <h3 style={{
                        textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '700',
                        color: 'var(--text-secondary)', marginBottom: '12px', paddingLeft: '8px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <Calendar size={14} /> {month}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {grouped[month].map(t => {
                            const goalName = getGoalName(t.goal_id);
                            return (
                                <div key={t.id} className="card" style={{
                                    padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: '16px',
                                    transition: 'transform 0.2s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            background: 'rgba(52, 199, 89, 0.1)', color: 'var(--success)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>{t.description}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {t.date ? new Date(t.date).toLocaleDateString('pt-BR') : 'Sem data'}
                                                {goalName && (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        background: 'var(--bg-secondary)',
                                                        padding: '2px 8px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        <Target size={10} />
                                                        {goalName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--success)' }}>
                                            + R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                                            <button onClick={() => navigate(`/edit-transaction/${t.id}`)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <AddGoalModal
                isOpen={isAddGoalOpen}
                onClose={() => setIsAddGoalOpen(false)}
                onSave={addGoal}
            />

            <GoalDetailModal
                goal={selectedGoal}
                isOpen={!!selectedGoal}
                onClose={() => {
                    setSelectedGoal(null);
                    // Refresh goals to update progress
                    fetchGoals();
                }}
                onDelete={handleGoalDeleted}
            />
        </div>
    );
}
