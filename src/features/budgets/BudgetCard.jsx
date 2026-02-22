import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import BudgetProgressBar from './BudgetProgressBar';

const formatCurrency = (value) =>
    Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function BudgetCard({ budget, onEdit, onRemove }) {
    const { category, spent, amount, percentage, status, remaining } = budget;

    return (
        <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '16px 20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                        fontSize: 20,
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: category?.color ? `${category.color}18` : '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {category?.icon || '📦'}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                        {category?.name || 'Categoria'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => onEdit(budget)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        aria-label="Editar orçamento"
                    >
                        <Pencil size={16} color="#888" />
                    </button>
                    <button
                        onClick={() => onRemove(budget.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        aria-label="Excluir orçamento"
                    >
                        <Trash2 size={16} color="#888" />
                    </button>
                </div>
            </div>

            {/* Progress */}
            <BudgetProgressBar percentage={percentage} status={status} />

            {/* Values */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666' }}>
                <span>{formatCurrency(spent)} de {formatCurrency(amount)}</span>
                <span style={{
                    fontWeight: 600,
                    color: status === 'exceeded' ? '#FF3B30'
                        : status === 'critical' ? '#FF3B30'
                            : status === 'warning' ? '#FF9500'
                                : '#34C759'
                }}>
                    {percentage}%
                </span>
            </div>

            {status === 'exceeded' && (
                <div style={{
                    fontSize: 12,
                    color: '#FF3B30',
                    fontWeight: 500,
                    textAlign: 'center',
                    padding: '4px 0',
                }}>
                    Ultrapassado em {formatCurrency(Math.abs(remaining))}
                </div>
            )}
        </div>
    );
}
