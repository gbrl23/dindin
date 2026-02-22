import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, BarChart3, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useReports } from '../../hooks/useReports';
import CategoryPieChart from '../../components/CategoryPieChart';
import CumulativeLineChart from '../../components/CumulativeLineChart';
import { exportCsv } from '../../utils/exportCsv';
import { exportPdf } from '../../utils/exportPdf';

const formatCurrency = (value) =>
    Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PERIOD_OPTIONS = [
    { key: 'month', label: 'Este mes' },
    { key: 'last3', label: 'Ultimos 3m' },
    { key: 'last6', label: 'Ultimos 6m' },
    { key: 'year', label: 'Este ano' },
    { key: 'custom', label: 'Personalizado' },
];

const TYPE_OPTIONS = [
    { key: 'all', label: 'Todos' },
    { key: 'expense', label: 'Despesas' },
    { key: 'income', label: 'Receitas' },
];

function getDateRange(periodKey, selectedDate) {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const pad = (n) => String(n).padStart(2, '0');

    switch (periodKey) {
        case 'month': {
            const lastDay = new Date(y, m + 1, 0).getDate();
            return {
                startDate: `${y}-${pad(m + 1)}-01`,
                endDate: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
            };
        }
        case 'last3': {
            const start = new Date(y, m - 2, 1);
            const lastDay = new Date(y, m + 1, 0).getDate();
            return {
                startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`,
                endDate: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
            };
        }
        case 'last6': {
            const start = new Date(y, m - 5, 1);
            const lastDay = new Date(y, m + 1, 0).getDate();
            return {
                startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`,
                endDate: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
            };
        }
        case 'year': {
            return {
                startDate: `${y}-01-01`,
                endDate: `${y}-12-31`,
            };
        }
        default:
            return { startDate: '', endDate: '' };
    }
}

export default function ReportsView() {
    const { selectedDate } = useDashboard();
    const { transactions } = useTransactions();
    const { categories } = useCategories();

    // Filter state
    const [period, setPeriod] = useState('month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [type, setType] = useState('all');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState(null);

    // Compute date range
    const dateRange = useMemo(() => {
        if (period === 'custom') {
            return { startDate: customStart, endDate: customEnd };
        }
        return getDateRange(period, selectedDate);
    }, [period, customStart, customEnd, selectedDate]);

    // Stable filters object
    const filters = useMemo(() => ({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        categoryIds: selectedCategoryIds,
        type,
    }), [dateRange.startDate, dateRange.endDate, selectedCategoryIds, type]);

    const { filtered, summary, categoryBreakdown, timeline } = useReports(transactions, filters);

    // Expense categories for filter
    const expenseCategories = useMemo(
        () => categories.filter(c => c.type === 'expense'),
        [categories]
    );

    const toggleCategory = (catId) => {
        setSelectedCategoryIds(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const periodLabel = useMemo(() => {
        if (!dateRange.startDate || !dateRange.endDate) return '';
        const s = dateRange.startDate.split('-');
        const e = dateRange.endDate.split('-');
        const startLabel = `${s[2]}/${s[1]}/${s[0]}`;
        const endLabel = `${e[2]}/${e[1]}/${e[0]}`;
        return `${startLabel} a ${endLabel}`;
    }, [dateRange]);

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '100px', marginTop: '24px' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>
                    Relatorios
                </h1>
                {filtered.length > 0 && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => exportCsv(filtered, dateRange.startDate, dateRange.endDate)}
                            style={{
                                background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none',
                                padding: '8px 16px', borderRadius: '20px', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                                fontSize: '0.85rem',
                            }}
                        >
                            <Download size={16} /> CSV
                        </button>
                        <button
                            onClick={() => exportPdf({
                                summary,
                                categoryBreakdown,
                                startDate: dateRange.startDate,
                                endDate: dateRange.endDate,
                            })}
                            style={{
                                background: 'var(--text-primary)', color: '#fff', border: 'none',
                                padding: '8px 16px', borderRadius: '20px', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                                fontSize: '0.85rem',
                            }}
                        >
                            <FileText size={16} /> PDF
                        </button>
                    </div>
                )}
            </header>

            {/* Period Filter Chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {PERIOD_OPTIONS.map(opt => (
                    <button
                        key={opt.key}
                        onClick={() => setPeriod(opt.key)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 20,
                            border: period === opt.key ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                            background: period === opt.key ? 'rgba(81, 0, 255, 0.08)' : 'var(--bg-card)',
                            color: period === opt.key ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Custom date inputs */}
            {period === 'custom' && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Inicio</label>
                        <input
                            type="date"
                            value={customStart}
                            onChange={e => setCustomStart(e.target.value)}
                            style={{
                                padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)',
                                fontSize: '0.9rem', background: 'var(--bg-card)', color: 'var(--text-primary)',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fim</label>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={e => setCustomEnd(e.target.value)}
                            style={{
                                padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)',
                                fontSize: '0.9rem', background: 'var(--bg-card)', color: 'var(--text-primary)',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Type Filter + Category Filter */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
                {TYPE_OPTIONS.map(opt => (
                    <button
                        key={opt.key}
                        onClick={() => setType(opt.key)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 16,
                            border: type === opt.key ? '1.5px solid var(--text-primary)' : '1px solid var(--border)',
                            background: type === opt.key ? 'var(--text-primary)' : 'transparent',
                            color: type === opt.key ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
                <button
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    style={{
                        padding: '6px 14px',
                        borderRadius: 16,
                        border: selectedCategoryIds.length > 0 ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                        background: selectedCategoryIds.length > 0 ? 'rgba(81, 0, 255, 0.08)' : 'transparent',
                        color: selectedCategoryIds.length > 0 ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    Categorias {selectedCategoryIds.length > 0 && `(${selectedCategoryIds.length})`}
                    {showCategoryFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {selectedCategoryIds.length > 0 && (
                    <button
                        onClick={() => setSelectedCategoryIds([])}
                        style={{
                            padding: '6px 12px', borderRadius: 16, border: 'none',
                            background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                            fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500,
                        }}
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            {/* Category multi-select dropdown */}
            {showCategoryFilter && (
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20,
                    padding: 16, background: 'var(--bg-secondary)', borderRadius: 16,
                }}>
                    {expenseCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 12,
                                border: selectedCategoryIds.includes(cat.id)
                                    ? `1.5px solid ${cat.color}` : '1px solid var(--border)',
                                background: selectedCategoryIds.includes(cat.id)
                                    ? `${cat.color}18` : 'var(--bg-card)',
                                color: selectedCategoryIds.includes(cat.id) ? cat.color : 'var(--text-secondary)',
                                fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}
                        >
                            <span>{cat.icon}</span> {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Period Label */}
            {periodLabel && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Periodo: {periodLabel} — {filtered.length} transacoes
                </div>
            )}

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                <div style={{
                    background: 'var(--bg-card)', padding: 16, borderRadius: 16,
                    borderLeft: '4px solid var(--success)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <ArrowUp size={16} color="var(--success)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>RECEITAS</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(summary.totalIncome)}</div>
                </div>
                <div style={{
                    background: 'var(--bg-card)', padding: 16, borderRadius: 16,
                    borderLeft: '4px solid var(--danger)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <ArrowDown size={16} color="var(--danger)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>DESPESAS</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(summary.totalExpenses)}</div>
                </div>
                <div style={{
                    background: 'var(--bg-card)', padding: 16, borderRadius: 16,
                    borderLeft: `4px solid ${summary.balance >= 0 ? 'var(--success)' : 'var(--danger)'}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <BarChart3 size={16} color="var(--primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>BALANCO</span>
                    </div>
                    <div style={{
                        fontSize: '1.2rem', fontWeight: 700,
                        color: summary.balance >= 0 ? 'var(--success)' : 'var(--danger)',
                    }}>
                        {formatCurrency(summary.balance)}
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            {filtered.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
                    {/* Pie Chart */}
                    <div className="card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
                            Distribuicao por Categoria
                        </h3>
                        <CategoryPieChart transactions={filtered} height={200} />
                    </div>

                    {/* Line Chart */}
                    <div className="card" style={{ padding: 24, minHeight: 280 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
                            Evolucao no Periodo
                        </h3>
                        <CumulativeLineChart
                            incomeData={timeline.incomeData}
                            expenseData={timeline.expenseData}
                            labels={timeline.labels}
                            height={200}
                        />
                    </div>
                </div>
            )}

            {/* Category Breakdown */}
            {categoryBreakdown.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>
                        Detalhamento por Categoria
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {categoryBreakdown.map(cat => (
                            <div key={cat.categoryId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                {/* Category Header */}
                                <div
                                    onClick={() => setExpandedCategory(
                                        expandedCategory === cat.categoryId ? null : cat.categoryId
                                    )}
                                    style={{
                                        padding: '14px 20px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{
                                            fontSize: 18, width: 36, height: 36, borderRadius: 10,
                                            backgroundColor: `${cat.color}18`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {cat.icon}
                                        </span>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cat.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {cat.count} transacao{cat.count !== 1 ? 'es' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{formatCurrency(cat.total)}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cat.percentage}%</div>
                                        </div>
                                        {expandedCategory === cat.categoryId
                                            ? <ChevronUp size={16} color="var(--text-secondary)" />
                                            : <ChevronDown size={16} color="var(--text-secondary)" />}
                                    </div>
                                </div>

                                {/* Expanded Transactions */}
                                {expandedCategory === cat.categoryId && (
                                    <div style={{
                                        background: 'var(--bg-secondary)',
                                        borderTop: '1px solid var(--border)',
                                    }}>
                                        {cat.transactions.map(tx => (
                                            <div key={tx.id} style={{
                                                padding: '10px 20px 10px 68px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderBottom: '1px solid var(--border)',
                                                fontSize: '0.85rem',
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{tx.description}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {tx.date?.substring(8, 10)}/{tx.date?.substring(5, 7)}
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{formatCurrency(tx.amount)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                }}>
                    <BarChart3 size={48} strokeWidth={1.5} color="var(--text-secondary)" />
                    <div>
                        <p style={{ fontWeight: 600, fontSize: 16, margin: '0 0 4px' }}>Nenhuma transacao encontrada</p>
                        <p style={{ fontSize: 14, margin: 0 }}>
                            Ajuste os filtros para visualizar seus dados.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
