import React, { useState, useEffect } from 'react';
import { X, Target, Plus, TrendingUp, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function GoalDetailModal({ goal, isOpen, onClose, onDelete }) {
    const navigate = useNavigate();
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && goal) {
            fetchContributions();
        }
    }, [isOpen, goal]);

    const fetchContributions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('goal_id', goal.id)
                .eq('type', 'investment')
                .order('date', { ascending: false });

            if (error) throw error;
            setContributions(data || []);
        } catch (err) {
            console.error('Error fetching contributions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewContribution = () => {
        onClose();
        navigate(`/add-transaction?type=investment&goalId=${goal.id}`);
    };

    const handleDeleteGoal = async () => {
        if (contributions.length > 0) {
            if (!window.confirm(`Esta meta possui ${contributions.length} aporte(s). Tem certeza que deseja excluí-la? Os aportes permanecerão, mas sem vínculo.`)) {
                return;
            }
        } else if (!window.confirm('Tem certeza que deseja excluir esta meta?')) {
            return;
        }

        try {
            // First, unlink contributions
            if (contributions.length > 0) {
                await supabase
                    .from('transactions')
                    .update({ goal_id: null })
                    .eq('goal_id', goal.id);
            }

            // Then delete the goal
            await onDelete(goal.id);
            onClose();
        } catch (err) {
            alert('Erro ao excluir meta: ' + err.message);
        }
    };

    if (!isOpen || !goal) return null;

    const percentage = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
    const remaining = goal.target_amount - goal.current_amount;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                className="card animate-scale-in"
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    maxHeight: '85vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-card)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div style={{
                    background: `linear-gradient(135deg, ${goal.color} 0%, ${goal.color}CC 100%)`,
                    padding: '24px',
                    color: 'white',
                    position: 'relative'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        <X size={18} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '16px',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Target size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>{goal.name}</h2>
                            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>{percentage.toFixed(0)}% concluído</span>
                        </div>
                    </div>

                    {/* Progress */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{
                            width: '100%',
                            height: '8px',
                            background: 'rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                background: 'white',
                                borderRadius: '4px',
                                transition: 'width 0.5s ease'
                            }} />
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '4px' }}>Acumulado</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                                R$ {goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '4px' }}>Falta</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                                R$ {remaining > 0 ? remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Histórico de Aportes</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {contributions.length} aporte{contributions.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            Carregando...
                        </div>
                    ) : contributions.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '16px',
                            color: 'var(--text-secondary)'
                        }}>
                            <TrendingUp size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                            <p style={{ margin: 0 }}>Nenhum aporte registrado</p>
                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Faça seu primeiro aporte!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {contributions.map(c => (
                                <div
                                    key={c.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: `${goal.color}20`,
                                            color: goal.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <TrendingUp size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                                {c.description || 'Aporte'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={12} />
                                                {new Date(c.date).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--success)' }}>
                                        +R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '16px 24px 24px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: '12px'
                }}>
                    <button
                        onClick={handleDeleteGoal}
                        style={{
                            padding: '14px',
                            borderRadius: '14px',
                            background: '#FFF0F0',
                            color: 'var(--danger)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        onClick={handleNewContribution}
                        className="btn btn-primary"
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: goal.color,
                            boxShadow: `0 8px 20px ${goal.color}40`
                        }}
                    >
                        <Plus size={20} />
                        Novo Aporte
                    </button>
                </div>
            </div>
        </div>
    );
}
