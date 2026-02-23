import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSwipe } from '../../hooks/useSwipe';
import { useTransactions } from '../../hooks/useTransactions';
import { useCards } from '../../hooks/useCards';
import { useCategories } from '../../hooks/useCategories';
import { useProfiles } from '../../hooks/useProfiles';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import {
    Search, Filter, Download,
    ArrowUp, ArrowDown, TrendingUp, FileText,
    CreditCard, User, Calendar, Edit2, Trash2, Check, X, Tag,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseLocalDate, displayDate, displayDateShort } from '../../utils/dateUtils';
import {
    SwipeableList,
    SwipeableListItem,
    SwipeAction,
    TrailingActions,
    LeadingActions,
    Type as ListType
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import SeriesActionModal from '../../components/SeriesActionModal';

// --- COMPONENTS ---

// Mobile 'Globo' Type Switcher
function MobileTypeSwitcher({ selectedType, setSelectedType }) {
    const types = [
        { id: 'all', label: 'Todos' },
        { id: 'income', label: 'Receitas' },
        { id: 'expense', label: 'Despesas' },
        { id: 'investment', label: 'Investimentos' },
        { id: 'bill', label: 'Contas' }
    ];

    const currentIndex = types.findIndex(t => t.id === selectedType);

    const handleNext = () => {
        const nextIndex = (currentIndex + 1) % types.length;
        setSelectedType(types[nextIndex].id);
    };

    const handlePrev = () => {
        const prevIndex = (currentIndex - 1 + types.length) % types.length;
        setSelectedType(types[prevIndex].id);
    };

    const swipeHandlers = useSwipe({
        onSwipeLeft: handleNext,
        onSwipeRight: handlePrev
    });

    const activeItem = types[currentIndex];

    return (
        <div
            {...swipeHandlers}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                padding: '8px', // Slightly larger padding
                userSelect: 'none',
                touchAction: 'pan-y' // Allow vertical scroll but capture horizontal
            }}
        >
            <button
                onClick={handlePrev}
                style={{
                    background: 'transparent', border: 'none',
                    color: 'var(--text-tertiary)', padding: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <ChevronLeft size={24} />
            </button>

            <div style={{
                flex: 1,
                textAlign: 'center',
                fontWeight: '800', // Bold/Heavy font as requested
                fontSize: '1rem',
                color: selectedType === 'all' ? 'var(--text-primary)' : 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                animation: 'fadeIn 0.3s ease'
            }}>
                {activeItem.label}
            </div>

            <button
                onClick={handleNext}
                style={{
                    background: 'transparent', border: 'none',
                    color: 'var(--text-tertiary)', padding: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <ChevronRight size={24} />
            </button>
        </div>
    );
}

export default function TransactionsView() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const { selectedDate } = useDashboard();

    // Data Hooks
    const { transactions, fetchTransactions, removeTransaction, removeTransactionSeries } = useTransactions();
    const { cards } = useCards();
    const { categories } = useCategories();
    const { profiles, myProfile } = useProfiles();

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedCard, setSelectedCard] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showFilters, setShowFilters] = useState(false); // Mobile filter toggle

    // Mobile Selection Mode (Long-press to activate)
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const longPressTimer = useRef(null);

    // Long-press handler para ativar modo seleção (igual Google Drive)
    const handleLongPressStart = useCallback((transactionId) => {
        if (!isMobile) return;
        longPressTimer.current = setTimeout(() => {
            setIsSelectionMode(true);
            setSelectedIds([transactionId]);
        }, 500); // 500ms para ativar long-press
    }, [isMobile]);

    const handleLongPressEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, seriesId: null, isBulk: false });

    // Handle Confirm Delete Series
    const handleConfirmDeleteSeries = async (scope) => {
        if (!deleteModal.id && !deleteModal.seriesId) return;

        try {
            if (scope === 'single') {
                if (deleteModal.isBulk) {
                    // Not implemented for bulk yet on this view simply
                    // But if it was triggered for single item with series
                    await removeTransaction(deleteModal.id);
                } else {
                    await removeTransaction(deleteModal.id);
                }
            } else {
                // scope is 'future' or 'all'
                // We need removeTransactionSeries from hook
                if (removeTransactionSeries) {
                    await removeTransactionSeries(deleteModal.id, deleteModal.seriesId, scope);
                } else {
                    alert('Função de remover série não disponível');
                }
            }
            await fetchTransactions();
            setDeleteModal({ show: false, id: null, seriesId: null, isBulk: false });
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir: ' + error.message);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);



    // --- FILTER LOGIC ---
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // 1. Month Filter
            const d = parseLocalDate(t.invoice_date || t.date);
            if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) return false;

            // 2. Type Filter
            if (selectedType !== 'all') {
                if (t.type !== selectedType) return false;
            }

            // 3. Card Filter
            if (selectedCard !== 'all') {
                if (t.card_id !== selectedCard) return false;
            }

            // 4. Category Filter (Replaces Member)
            if (selectedCategory !== 'all') {
                if (t.category_id !== selectedCategory) return false;
            }

            // 5. Search
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchDesc = t.description.toLowerCase().includes(searchLower);
                const matchVal = t.amount.toString().includes(searchLower);
                if (!matchDesc && !matchVal) return false;
            }

            return true;
        });
    }, [transactions, selectedMonth, selectedYear, selectedType, selectedCard, selectedCategory, searchTerm]);

    // --- SUMMARY STATS (FILTERED) ---
    const stats = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = filteredTransactions.filter(t => t.type !== 'income').reduce((acc, t) => acc + t.amount, 0); // Include invest/bill as expense for diff? Usually yes.
        return {
            income,
            expense,
            balance: income - expense,
            count: filteredTransactions.length
        };
    }, [filteredTransactions]);


    // CSV Export
    const handleExport = () => {
        const headers = ["Data", "Descrição", "Tipo", "Valor", "Cartão", "Quem Pagou"];
        const rows = filteredTransactions.map(t => [
            t.date,
            t.description,
            t.type,
            t.amount,
            t.card?.name || '-',
            t.payer_id || '-' // Need to map ID to name ideally
        ]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transacoes_${selectedMonth + 1}_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- SELECTION STATE ---
    const [selectedIds, setSelectedIds] = useState([]);

    // Sair do modo seleção quando não há itens selecionados
    useEffect(() => {
        if (selectedIds.length === 0 && isSelectionMode) {
            setIsSelectionMode(false);
        }
    }, [selectedIds, isSelectionMode]);

    const toggleSelection = useCallback((id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(sid => sid !== id)
                : [...prev, id]
        );
    }, []);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredTransactions.map(t => t.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkDelete = async () => {
        const selectedTransactions = filteredTransactions.filter(t => selectedIds.includes(t.id));
        const totalAmount = selectedTransactions.reduce((sum, t) => sum + t.amount, 0);

        const confirmMessage = `Excluir ${selectedIds.length} transação(ões)?\n\n` +
            `💰 Total: R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
            `Esta ação não pode ser desfeita.`;

        if (window.confirm(confirmMessage)) {
            try {
                await Promise.all(selectedIds.map(id => removeTransaction(id)));
                setSelectedIds([]);
                await fetchTransactions();
            } catch (err) {
                alert('Erro ao excluir: ' + err.message);
            }
        }
    }

    const handleDeleteSingle = async (t) => {
        // Check for series
        if (t.series_id) {
            setDeleteModal({ show: true, id: t.id, seriesId: t.series_id, isBulk: false });
            return;
        }

        if (window.confirm(`Excluir "${t.description}"?`)) {
            try {
                await removeTransaction(t.id);
                await fetchTransactions();
            } catch (err) {
                alert(err.message);
            }
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>


            {/* Header (Title + Global Actions) is in TopHeader component, we are in the Workspace area */}
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '8px' }}>Histórico</h1>

            {/* CONTROL BAR (Search, Tabs, Filters) */}
            {isMobile ? (
                // ========== MOBILE LAYOUT (Stacked: Switcher -> Search -> Filter Toggle) ==========
                <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* 1. Type Switcher (Globo) */}
                    <MobileTypeSwitcher selectedType={selectedType} setSelectedType={setSelectedType} />

                    {/* 2. Search Bar */}
                    <div style={{ position: 'relative', width: '100%' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar lançamentos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 42px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-secondary)',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* 3. Filters Toggle & Content */}
                    <div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                width: '100%',
                                border: 'none',
                                background: showFilters ? 'var(--bg-primary)' : 'transparent',
                                color: showFilters ? 'var(--primary)' : 'var(--text-secondary)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '0.9rem',
                                outline: 'none',
                                fontWeight: '600',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Filter size={16} />
                                <span>Filtros</span>
                            </div>
                            <span style={{ fontSize: '0.8rem' }}>{showFilters ? 'Ocultar' : 'Mostrar'}</span>
                        </button>

                        {/* Expanded Filters */}
                        {showFilters && (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', padding: '4px' }}>
                                {/* Card Filter */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '10px 12px', border: '1px solid var(--border)' }}>
                                    <CreditCard size={18} color="var(--text-secondary)" />
                                    <select
                                        value={selectedCard}
                                        onChange={e => setSelectedCard(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', fontSize: '0.95rem', outline: 'none', color: 'var(--text-primary)', width: '100%' }}
                                    >
                                        <option value="all">Todos os cartões</option>
                                        {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {/* Category Filter */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '10px 12px', border: '1px solid var(--border)' }}>
                                    <Tag size={18} color="var(--text-secondary)" />
                                    <select
                                        value={selectedCategory}
                                        onChange={e => setSelectedCategory(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', fontSize: '0.95rem', outline: 'none', color: 'var(--text-primary)', width: '100%' }}
                                    >
                                        <option value="all">Todas as categorias</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // ========== DESKTOP LAYOUT (Original) ==========
                <div className="card" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Search & Tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Buscar lançamentos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 42px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-secondary)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={e => e.target.style.background = 'var(--bg-card)'}
                                onBlur={e => e.target.style.background = 'var(--bg-secondary)'}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '0px' }}>
                            {[
                                { id: 'all', label: 'Todos' },
                                { id: 'income', label: 'Receitas' },
                                { id: 'expense', label: 'Despesas' },
                                { id: 'investment', label: 'Investimentos' },
                                { id: 'bill', label: 'Contas' }
                            ].map(tab => {
                                const isActive = selectedType === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedType(tab.id)}
                                        style={{
                                            padding: '10px 18px',
                                            borderRadius: '24px',
                                            border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                                            background: isActive ? 'var(--bg-primary)' : 'transparent',
                                            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                            fontWeight: '600',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 8px 8px 8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '8px 12px', border: '1px solid var(--border)' }}>
                            <CreditCard size={16} color="var(--text-secondary)" />
                            <select
                                value={selectedCard}
                                onChange={e => setSelectedCard(e.target.value)}
                                style={{ background: 'transparent', border: 'none', fontSize: '0.9rem', outline: 'none', color: 'var(--text-primary)', minWidth: '140px' }}
                            >
                                <option value="all">Todos os cartões</option>
                                {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '8px 12px', border: '1px solid var(--border)' }}>
                            <Tag size={16} color="var(--text-secondary)" />
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                style={{ background: 'transparent', border: 'none', fontSize: '0.9rem', outline: 'none', color: 'var(--text-primary)', minWidth: '140px' }}
                            >
                                <option value="all">Todas as categorias</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1 }}></div>

                        <button
                            onClick={handleExport}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                            <Download size={18} />
                            Exportar CSV
                        </button>
                    </div>
                </div>
            )}

            {/* Category Total Indicator */}
            {selectedCategory !== 'all' && (
                <div className="animate-fade-in" style={{ margin: '0 8px', padding: '12px 16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--primary)', maxWidth: '400px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={18} />
                        Total em {categories.find(c => c.id === selectedCategory)?.name || 'Categoria'}
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                        R$ {filteredTransactions.reduce((acc, t) => acc + (t.type === 'expense' ? t.amount : 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            )}


            {/* 3. Summary Cards (Mobile: 2x2 Grid, Desktop: 1x4) */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Receitas</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--success)' }}>
                        R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Despesas</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Diferença</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: stats.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Quantidade</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {stats.count}
                    </div>
                </div>
            </div>

            {/* 4. List / Grid */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                {/* Contextual Action Bar OR Normal Header */}
                {selectedIds.length > 0 ? (
                    <div style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--primary)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button
                                onClick={() => setSelectedIds([])}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 32, height: 32,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#fff'
                                }}
                                title="Limpar seleção"
                            >
                                <X size={18} />
                            </button>
                            <div>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                    {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
                                </span>
                                <span style={{ marginLeft: '12px', opacity: 0.8, fontSize: '0.9rem' }}>
                                    (Total: R$ {
                                        filteredTransactions
                                            .filter(t => selectedIds.includes(t.id))
                                            .reduce((sum, t) => sum + t.amount, 0)
                                            .toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                    })
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={handleBulkDelete}
                                style={{
                                    background: 'var(--bg-card)',
                                    color: 'var(--danger)',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <Trash2 size={18} />
                                Excluir Seleção
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Lançamentos de {selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                    </div>
                )}

                {filteredTransactions.length === 0 ? (
                    <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p>Nenhuma transação encontrada com os filtros atuais.</p>
                    </div>
                ) : isMobile ? (
                    /* ========== MOBILE: SwipeableList Real (Restored) ========== */
                    <div style={{ padding: '0 16px', paddingBottom: '80px' }}>
                        <SwipeableList fullSwipe={false}>
                            {filteredTransactions.map(t => {
                                const isSelected = selectedIds.includes(t.id);
                                const categoryColor = t.category_details?.color || 'var(--text-secondary)';

                                // Trailing actions (swipe left = delete)
                                const trailingActions = () => (
                                    <TrailingActions>
                                        <SwipeAction
                                            destructive={true}
                                            onClick={() => handleDeleteSingle(t)}
                                        >
                                            <div style={{
                                                background: 'var(--danger)',
                                                color: '#FFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0 24px',
                                                height: '100%'
                                            }}>
                                                <Trash2 size={20} />
                                            </div>
                                        </SwipeAction>
                                    </TrailingActions>
                                );

                                // Leading actions (swipe right = edit)
                                const leadingActions = () => (
                                    <LeadingActions>
                                        <SwipeAction onClick={() => navigate(`/edit-transaction/${t.id}`)}>
                                            <div style={{
                                                background: 'var(--primary)',
                                                color: '#FFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0 24px',
                                                height: '100%'
                                            }}>
                                                <Edit2 size={20} />
                                            </div>
                                        </SwipeAction>
                                    </LeadingActions>
                                );

                                return (
                                    <SwipeableListItem
                                        key={t.id}
                                        trailingActions={trailingActions()}
                                        leadingActions={leadingActions()}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '12px 0',
                                                gap: '12px',
                                                borderBottom: '1px solid var(--border-light)',
                                                background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)',
                                                width: '100%'
                                            }}
                                            onClick={() => {
                                                if (isSelectionMode) {
                                                    toggleSelection(t.id);
                                                } else {
                                                    navigate(`/edit-transaction/${t.id}`);
                                                }
                                            }}
                                            onTouchStart={() => handleLongPressStart(t.id)}
                                            onTouchEnd={handleLongPressEnd}
                                            onTouchCancel={handleLongPressEnd}
                                        >
                                            {/* Checkbox (só aparece em modo seleção) */}
                                            {isSelectionMode && (
                                                <div style={{
                                                    width: 22, height: 22,
                                                    borderRadius: '6px',
                                                    border: '2px solid ' + (isSelected ? 'var(--primary)' : 'var(--border)'),
                                                    background: isSelected ? 'var(--primary)' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {isSelected && <Check size={14} color="#FFF" strokeWidth={3} />}
                                                </div>
                                            )}

                                            {/* Ícone da Categoria */}
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '12px',
                                                background: t.category_details ? `${t.category_details.color}20` : 'var(--bg-secondary)',
                                                color: categoryColor,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.1rem', flexShrink: 0
                                            }}>
                                                {t.category_details?.icon ||
                                                    (t.type === 'income' ? <ArrowUp size={18} color="var(--success)" /> :
                                                        t.type === 'investment' ? <TrendingUp size={18} color="#3b82f6" /> :
                                                            t.type === 'bill' ? <FileText size={18} color="#f59e0b" /> :
                                                                <ArrowDown size={18} color="var(--danger)" />)
                                                }
                                            </div>

                                            {/* Descrição e Data */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontWeight: '600',
                                                    fontSize: '0.95rem',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {t.description}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                    <span>{displayDateShort(t.date)}</span>
                                                    {t.shares && t.shares.length > 1 && (
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                            background: 'rgba(59, 130, 246, 0.1)',
                                                            color: 'var(--primary)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontWeight: '600',
                                                            fontSize: '0.7rem'
                                                        }}>
                                                            <User size={10} />
                                                            {t.shares.length - 1}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Valor */}
                                            <div style={{
                                                fontWeight: '700',
                                                fontSize: '0.95rem',
                                                color: t.type === 'income' ? 'var(--success)' : 'var(--text-primary)',
                                                flexShrink: 0,
                                                textAlign: 'right'
                                            }}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </SwipeableListItem>
                                );
                            })}
                        </SwipeableList>
                    </div>
                ) : (
                    /* ========== DESKTOP: Tabela original ========== */
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                            <thead style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    {/* Checkbox Header */}
                                    <th style={{ padding: '16px 24px', width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                                            onChange={handleSelectAll}
                                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                                        />
                                    </th>
                                    <th style={{ padding: '16px', width: '60px' }}>#</th>
                                    <th style={{ padding: '16px', width: 'auto' }}>Descrição</th>
                                    <th style={{ padding: '16px', width: '110px' }}>Data</th>
                                    <th style={{ padding: '16px', width: '160px' }}>Categoria</th>
                                    <th style={{ padding: '16px', width: '120px' }}>Origem</th>
                                    <th style={{ padding: '16px', width: '140px' }}>Dividido com</th>
                                    <th style={{ padding: '16px', width: '140px', textAlign: 'left' }}>Valor</th>
                                    <th style={{ padding: '16px', width: '100px', textAlign: 'left' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((t, index) => {
                                    const isSelected = selectedIds.includes(t.id);
                                    return (
                                        <tr key={t.id}
                                            onClick={() => toggleSelection(t.id)}
                                            style={{
                                                borderBottom: '1px solid var(--border-light)',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s',
                                                background: isSelected ? 'var(--bg-secondary)' : 'transparent'
                                            }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td style={{ padding: '16px 24px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }} // Handle by Row Click
                                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                />
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{
                                                    width: 36, height: 36,
                                                    borderRadius: '10px',
                                                    background: t.type === 'income' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(29, 29, 31, 0.05)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: t.type === 'income' ? 'var(--success)' : 'var(--text-primary)'
                                                }}>
                                                    {t.type === 'income' ? <ArrowUp size={18} /> :
                                                        t.type === 'investment' ? <TrendingUp size={18} color="var(--info)" /> :
                                                            t.type === 'bill' ? <FileText size={18} color="var(--warning)" /> :
                                                                <ArrowDown size={18} />}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: '600' }}>{t.description}</td>
                                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {displayDateShort(t.date)}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {t.category_details ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: 24, height: 24, borderRadius: '8px',
                                                            background: `${t.category_details.color}20`, color: t.category_details.color,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem'
                                                        }}>
                                                            {t.category_details.icon}
                                                        </div>
                                                        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{t.category_details.name}</span>
                                                    </div>
                                                ) : (
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500',
                                                        background: 'var(--bg-primary)', color: 'var(--text-secondary)', textTransform: 'capitalize'
                                                    }}>
                                                        {t.type === 'bill' ? 'Conta' : t.type === 'expense' ? 'Despesa' : t.type === 'income' ? 'Receita' : 'Investimento'}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                                                {(() => {
                                                    if (t.type !== 'expense') return '-';
                                                    const cardName = t.card?.name;
                                                    const payerName = t.payer?.full_name;
                                                    const isMyTransaction = t.payer?.id === myProfile?.id;
                                                    if (cardName) {
                                                        return isMyTransaction ? cardName : `${cardName} (${payerName?.split(' ')[0] || 'Outro'})`;
                                                    }
                                                    return isMyTransaction ? 'Dinheiro' : `Conta (${payerName?.split(' ')[0] || 'Outro'})`;
                                                })()}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {(() => {
                                                    if (!t.shares || t.shares.length <= 1) return <span style={{ color: 'var(--text-tertiary)' }}>-</span>;

                                                    // Sort: payer first, then others
                                                    const sorted = [...t.shares].sort((a, b) => {
                                                        const aIsPayer = a.profile_id === t.payer_id;
                                                        const bIsPayer = b.profile_id === t.payer_id;
                                                        if (aIsPayer && !bIsPayer) return -1;
                                                        if (!aIsPayer && bIsPayer) return 1;
                                                        return 0;
                                                    });

                                                    return (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {sorted.slice(0, 4).map(share => {
                                                                const p = share.profile || profiles.find(pr => pr.id === share.profile_id);
                                                                const isPayer = share.profile_id === t.payer_id;
                                                                return (
                                                                    <div key={share.profile_id} title={`${p?.full_name || 'Usuário'}${isPayer ? ' (pagou)' : ''}`} style={{
                                                                        width: 24, height: 24, borderRadius: '50%',
                                                                        background: isPayer ? 'var(--success)' : 'var(--primary)', color: '#fff',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '0.7rem', fontWeight: 'bold',
                                                                        border: isPayer ? '2px solid var(--success)' : '1px solid #fff'
                                                                    }}>
                                                                        {p?.avatar_url ? (
                                                                            <img src={p.avatar_url} alt={p.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                                        ) : (
                                                                            (p?.full_name?.[0] || '?').toUpperCase()
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                            {sorted.length > 4 && (
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>+{sorted.length - 4}</span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>

                                            <td style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: t.type === 'income' ? 'var(--success)' : 'var(--text-primary)' }}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'left', color: 'var(--text-tertiary)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/edit-transaction/${t.id}`); }}
                                                        style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }}
                                                        className="hover:bg-gray-200 rounded-md"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteSingle(t); }}
                                                        style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)' }}
                                                        className="hover:bg-gray-200 rounded-md"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Series Action Modal */}
            <SeriesActionModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ ...deleteModal, show: false })}
                onConfirm={handleConfirmDeleteSeries}
                action="delete"
                isBulk={deleteModal.isBulk}
            />
        </div >
    );
}
