import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../contexts/AuthContext';
import { useProfiles } from '../../hooks/useProfiles';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Trash2, Search, Calendar, Plus, CreditCard, Edit2, ChevronLeft, ChevronRight, FileText, CheckCircle, Clock, Check, Layers, Filter, Tag, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import ImportInvoiceModal from './ImportInvoiceModal';
import SeriesActionModal from '../../components/SeriesActionModal';
import { parseLocalDate, displayDateShort } from '../../utils/dateUtils';
import {
    SwipeableList,
    SwipeableListItem,
    SwipeAction,
    TrailingActions,
    LeadingActions,
    Type as ListType
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';

export default function TransactionsListView() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { transactions, removeTransaction, updateTransaction, fetchTransactions, removeTransactionSeries } = useTransactions();
    const { user } = useAuth();
    const { profiles } = useProfiles();
    const { categories } = useCategories();

    // State
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentDate, setCurrentDate] = useState(() => {
        if (location.state?.initialMonth !== undefined && location.state?.initialYear !== undefined) {
            const date = new Date();
            date.setFullYear(location.state.initialYear);
            date.setMonth(location.state.initialMonth);
            return date;
        }
        return new Date();
    });
    const [showImportModal, setShowImportModal] = useState(false);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, seriesId: null, isBulk: false });

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

    // Sair do modo seleção quando não há itens selecionados
    useEffect(() => {
        if (selectedIds.length === 0 && isSelectionMode) {
            setIsSelectionMode(false);
        }
    }, [selectedIds, isSelectionMode]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Navigation Handlers
    const prevMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const nextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    const currentMonthLabel = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const currentMonthKey = currentDate.toLocaleString('pt-BR', { month: '2-digit', year: 'numeric' }); // MM/AAAA comparison helper? Or simple Month check.

    const filteredTransactions = transactions.filter(t => {
        // Priority: Invoice > Competence > Date
        let dateToUse = t.date;
        if (t.type === 'expense' && t.card_id && t.invoice_date) {
            dateToUse = t.invoice_date;
        } else if (t.competence_date) {
            dateToUse = t.competence_date;
        }

        const tDate = parseLocalDate(dateToUse);

        // 1. Filter by Current Month View
        // Note: We use local month/year matching
        const isSameMonth = tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
        if (!isSameMonth) return false;

        // 2. Search Filter
        const lowerSearch = searchTerm.toLowerCase();
        if (!lowerSearch) return true;

        const matchesText =
            t.description.toLowerCase().includes(lowerSearch) ||
            t.card?.name?.toLowerCase().includes(lowerSearch) ||
            (displayDateShort(t.date).includes(searchTerm));

        // Smart Filter: Type
        if (lowerSearch === 'receita' || lowerSearch === 'receitas') return t.type === 'income';
        if (lowerSearch === 'despesa' || lowerSearch === 'despesas') return t.type === 'expense';
        if (lowerSearch === 'investimento' || lowerSearch === 'investimentos') return t.type === 'investment';

        // 2b. Filter by Category
        if (selectedCategory && t.category_id !== selectedCategory) {
            return false;
        }

        return matchesText;
    });

    // Grouping isn't strictly necessary for single month view unless we want to group by day?
    // User asked for "Navigation per month".
    // For now, let's just list them sorted by date desc.
    const sortedTransactions = [...filteredTransactions].sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));

    // Selection state
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleSelection = useCallback((id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    }, []);

    const handleDelete = async (transaction) => {
        // If this transaction is part of a series, show the modal
        if (transaction.series_id) {
            setDeleteModal({ show: true, id: transaction.id, seriesId: transaction.series_id, isBulk: false });
            return;
        }

        if (window.confirm('Tem certeza que deseja apagar este gasto?')) {
            await removeTransaction(transaction.id);
        }
    }

    const confirmDeleteSeries = async (scope) => {
        try {
            if (deleteModal.isBulk) {
                // Bulk Logic
                const selectedTransactions = transactions.filter(t => selectedIds.includes(t.id));

                if (scope === 'single') {
                    // Just deletes the specific selected IDs
                    await Promise.all(selectedIds.map(id => removeTransaction(id)));
                } else if (scope === 'all') {
                    // Complexity: Deletes SERIES for those that have it, and SINGLE for those that don't
                    const seriesIdsSeen = new Set();

                    const deletePromises = selectedTransactions.map(async (t) => {
                        if (t.series_id) {
                            if (!seriesIdsSeen.has(t.series_id)) {
                                seriesIdsSeen.add(t.series_id);
                                return removeTransactionSeries(t.id, t.series_id, 'all');
                            }
                            // Else: already handling this series
                            return Promise.resolve();
                        } else {
                            // No series, just delete the item
                            return removeTransaction(t.id);
                        }
                    });

                    await Promise.all(deletePromises);
                }

                setSelectedIds([]);
            } else {
                // Single Item Logic
                if (scope === 'single') {
                    await removeTransaction(deleteModal.id);
                } else {
                    await removeTransactionSeries(deleteModal.id, deleteModal.seriesId, scope);
                }
            }

            setDeleteModal({ show: false, id: null, seriesId: null, isBulk: false });
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;

        const selectedTransactions = transactions.filter(t => selectedIds.includes(t.id));
        const hasSeries = selectedTransactions.some(t => t.series_id);

        if (hasSeries) {
            setDeleteModal({ show: true, id: null, seriesId: null, isBulk: true });
        } else {
            if (window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} itens?`)) {
                try {
                    await Promise.all(selectedIds.map(id => removeTransaction(id)));
                    setSelectedIds([]);
                } catch (error) {
                    alert('Erro ao excluir itens: ' + error.message);
                }
            }
        }
    };



    const handleDeleteMonth = async () => {
        const count = sortedTransactions.length;
        if (count === 0) return;

        const total = sortedTransactions.reduce((sum, t) => sum + t.amount, 0);

        if (window.confirm(
            `Tem certeza que deseja apagar TODOS os ${count} lançamentos de ${currentMonthLabel}?\n\n` +
            `Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
            `Esta ação não pode ser desfeita!`
        )) {
            try {
                await Promise.all(sortedTransactions.map(t => removeTransaction(t.id)));
                await fetchTransactions();
            } catch (error) {
                console.error('Erro ao excluir lançamentos:', error);
                alert('Erro ao excluir alguns lançamentos. Tente novamente.');
            }
        }
    }

    return (
        <div className="container" style={{ paddingBottom: '80px', padding: isMobile ? '0 16px 80px' : '0' }}>
            {/* Header - Contextual */}
            <header style={{ marginBottom: isMobile ? '16px' : '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '48px', flexWrap: 'wrap', gap: isMobile ? '8px' : '0' }}>
                {selectedIds.length > 0 ? (
                    // Contextual Header (Drive Style)
                    <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'var(--primary)', color: '#fff', padding: '0 16px', borderRadius: '16px', height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button onClick={() => setSelectedIds([])} style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <ArrowLeft size={20} />
                            </button>
                            <span style={{ fontWeight: '600', fontSize: '1rem' }}>{selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={handleDeleteSelected} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ) : (
                    // Normal Header
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button onClick={() => navigate('/')} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
                                <ArrowLeft size={isMobile ? 20 : 24} />
                            </button>
                            <h1 className="text-gradient" style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: '800' }}>
                                Histórico
                            </h1>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="btn"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: isMobile ? '0' : '8px', padding: isMobile ? '8px' : '8px 16px', fontSize: '0.9rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            >
                                <FileText size={18} />
                                {!isMobile && 'Importar'}
                            </button>
                            <button
                                onClick={() => navigate('/add-transaction')}
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: isMobile ? '0' : '8px', padding: isMobile ? '8px' : '8px 16px', fontSize: '0.9rem' }}
                            >
                                <Plus size={18} />
                                {!isMobile && 'Novo'}
                            </button>
                        </div>
                    </>
                )}
            </header>

            {/* Navigation & Search */}
            <div className="card" style={{ padding: '8px', marginBottom: '24px' }}>
                {/* Month Navigator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 8px' }}>
                    <button onClick={prevMonth} style={{ background: 'transparent', color: 'var(--text-primary)', padding: '8px' }}>
                        <ChevronLeft size={24} />
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {currentMonthLabel}
                        </span>
                    </div>

                    <button onClick={nextMonth} style={{ background: 'transparent', color: 'var(--text-primary)', padding: '8px' }}>
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Sub-Header Actions */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '12px' }}>
                    {/* Checkbox for Select All */}
                    <input
                        type="checkbox"
                        checked={selectedIds.length === sortedTransactions.length && sortedTransactions.length > 0}
                        onChange={(e) => {
                            if (e.target.checked) {
                                setSelectedIds(sortedTransactions.map(t => t.id));
                            } else {
                                setSelectedIds([]);
                            }
                        }}
                        style={{ width: 20, height: 20, accentColor: 'var(--primary)', cursor: 'pointer', marginRight: '4px' }}
                    />

                    <Search size={18} color="var(--text-secondary)" />
                    <input
                        className="input"
                        placeholder="Buscar..."
                        style={{ border: 'none', padding: 0, background: 'transparent', fontSize: '0.9rem', flex: 1 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {sortedTransactions.length > 0 && !searchTerm && selectedIds.length === 0 && (
                        <button
                            onClick={handleDeleteMonth}
                            style={{ background: 'transparent', color: 'var(--danger)', border: 'none', padding: '4px', cursor: 'pointer' }}
                            title="Apagar todos do mês"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                {/* Filters Row */}
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', marginTop: '12px' }}>
                    <div style={{ position: 'relative', minWidth: '160px' }}>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{
                                width: '100%',
                                appearance: 'none',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                padding: '8px 36px 8px 12px',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                color: selectedCategory ? 'var(--text-primary)' : 'var(--text-secondary)',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">Todas as categorias</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
                            <Filter size={14} />
                        </div>
                    </div>
                    {/* Placeholder for future filters (Cards, Members) */}
                </div>

                {/* Category Total Indicator - User wanted to know how much was spent */}
                {selectedCategory && (
                    <div className="animate-fade-in" style={{ marginTop: '12px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--primary)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Tag size={16} />
                            Total na categoria
                        </span>
                        <span style={{ fontSize: '1rem', fontWeight: '800' }}>
                            R$ {sortedTransactions.reduce((acc, t) => acc + (t.type === 'expense' ? t.amount : 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                )}

            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0' : '12px' }}>
                {sortedTransactions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
                        Nenhum lançamento em {currentMonthLabel}.
                    </div>
                ) : isMobile ? (
                    /* ========== MOBILE: SwipeableList com layout compacto ========== */
                    <SwipeableList type={ListType.IOS} fullSwipe={false}>
                        {sortedTransactions.map(t => {
                            const isSelected = selectedIds.includes(t.id);
                            const categoryColor = t.category_details?.color || 'var(--text-secondary)';

                            // Trailing actions (swipe left = delete)
                            const trailingActions = () => (
                                <TrailingActions>
                                    <SwipeAction
                                        destructive={!t.series_id}
                                        onClick={() => handleDelete(t)}
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
                                            background: t.category_details ? `${categoryColor}20` : 'var(--bg-secondary)',
                                            color: categoryColor,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.1rem', flexShrink: 0
                                        }}>
                                            {t.category_details?.icon ||
                                                (t.type === 'income' ? <ArrowUp size={18} color="var(--success)" /> :
                                                    t.type === 'investment' ? <TrendingUp size={18} color="#3b82f6" /> :
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
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <span>{displayDateShort(t.date)}</span>
                                                {t.shares && t.shares.length > 0 && (
                                                    <span style={{ color: 'var(--primary)' }}>
                                                        • Dividido c/ {t.shares.length}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Valor */}
                                        <div style={{
                                            fontWeight: '700',
                                            fontSize: '0.95rem',
                                            color: t.type === 'income' ? 'var(--success)' :
                                                t.type === 'investment' ? '#3b82f6' :
                                                    'var(--text-primary)',
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
                ) : (
                    /* ========== DESKTOP: Layout original com checkbox e botões ========== */
                    sortedTransactions.map(t => {
                        const isSelected = selectedIds.includes(t.id);
                        return (
                            <div key={t.id}
                                className="card"
                                style={{
                                    padding: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: isSelected ? 'var(--bg-secondary)' : '#FFF',
                                    border: isSelected ? '1px solid var(--primary)' : 'none',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onClick={() => toggleSelection(t.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {/* Checkbox - Left Side */}
                                    <div
                                        className="checkbox-wrapper"
                                        onClick={(e) => { e.stopPropagation(); toggleSelection(t.id); }}
                                        style={{ display: 'flex', alignItems: 'center' }}
                                    >
                                        <div style={{
                                            width: 22, height: 22,
                                            borderRadius: '6px',
                                            border: '2px solid ' + (isSelected ? 'var(--primary)' : 'var(--border)'),
                                            background: isSelected ? 'var(--primary)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}>
                                            {isSelected && <Check size={14} color="#FFF" strokeWidth={3} />}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>{t.description}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {t.card && (
                                                    <>
                                                        <CreditCard size={12} /> {t.card.name}
                                                    </>
                                                )}
                                                {t.series_id && (
                                                    <span title="Item Recorrente" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', background: 'rgba(0, 122, 255, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        <Layers size={10} />
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Série</span>
                                                    </span>
                                                )}
                                            </span>
                                            {/* Show Payer */}
                                            {t.payer && user?.id && profiles.find(p => p.id === t.payer_id)?.user_id !== user.id && (
                                                <span style={{ color: 'var(--accent)' }}>
                                                    Pago por {t.payer.full_name?.split(' ')[0]}
                                                </span>
                                            )}
                                        </div>
                                        {t.shares && t.shares.length > 0 && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                {t.payer_id === profiles.find(p => p.user_id === user?.id)?.id ? (
                                                    `Dividido com ${t.shares.length} pessoa(s)`
                                                ) : (
                                                    (() => {
                                                        const myProfile = profiles.find(p => p.user_id === user?.id);
                                                        const myShare = t.shares.find(s => s.profile_id === myProfile?.id || (s.profile?.email === user?.email));
                                                        return myShare ? (
                                                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                                                                Sua parte: R$ {myShare.share_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        ) : `Dividido com ${t.shares.length} pessoa(s)`;
                                                    })()
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontWeight: '700', color:
                                                t.type === 'income' ? 'var(--success)' :
                                                    t.type === 'investment' ? '#3b82f6' :
                                                        t.type === 'bill' ? '#f59e0b' :
                                                            'var(--text-primary)'
                                        }}>
                                            {t.type === 'income' ? '+ ' : '- '}
                                            R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            {displayDateShort(t.date)}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/edit-transaction/${t.id}`); }}
                                            style={{ background: 'transparent', color: 'var(--text-primary)', opacity: 0.7, cursor: 'pointer' }}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(t); }}
                                            style={{ background: 'transparent', color: 'var(--danger)', opacity: 0.7, cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>


            <ImportInvoiceModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
            />

            {/* Smart Series Selection Modal */}
            <SeriesActionModal
                isOpen={deleteModal.show}
                action="delete"
                isBulk={deleteModal.isBulk}
                onClose={() => setDeleteModal({ show: false, id: null, seriesId: null, isBulk: false })}
                onConfirm={confirmDeleteSeries}
            />
        </div >
    );
}
