import React from 'react';
import { Plus, Target, Trophy } from 'lucide-react';

export default function GoalsSection({ goals, onAddClick, onGoalClick }) {

    const GoalCard = ({ goal }) => {
        const percentage = Math.min(100, (goal.current_amount / goal.target_amount) * 100);

        return (
            <button
                onClick={() => onGoalClick?.(goal)}
                style={{
                    minWidth: '220px',
                    height: '140px',
                    background: 'var(--bg-card)',
                    borderRadius: '20px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border)',
                    flexShrink: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: goal.color + '20', color: goal.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Target size={18} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: goal.color }}>
                        {percentage.toFixed(0)}%
                    </span>
                </div>

                <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>{goal.name}</h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        R$ {goal.current_amount.toLocaleString('pt-BR')} / {goal.target_amount.toLocaleString('pt-BR')}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: goal.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Minhas Metas</h2>
            </div>

            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                {/* Add New Goal Card */}
                <button
                    onClick={onAddClick}
                    style={{
                        minWidth: '80px',
                        height: '140px',
                        background: 'transparent',
                        borderRadius: '20px',
                        border: '2px dashed var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        gap: '8px',
                        flexShrink: 0,
                        transition: 'all 0.2s'
                    }}
                >
                    <Plus size={24} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Nova</span>
                </button>

                {goals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} />
                ))}

                {goals.length === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <Trophy size={20} /> Crie sua primeira meta!
                    </div>
                )}
            </div>
        </div>
    );
}
