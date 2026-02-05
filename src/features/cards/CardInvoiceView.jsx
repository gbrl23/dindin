import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCards } from '../../hooks/useCards';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Calendar, CreditCard, ShoppingBag, DollarSign, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

export default function CardInvoiceView() {
    const { cardId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { cards } = useCards();

    // Get initial month from navigation state (passed from Dashboard)
    const getInitialDate = () => {
        if (location.state?.initialMonth !== undefined && location.state?.initialYear !== undefined) {
            const date = new Date();
            date.setFullYear(location.state.initialYear);
            date.setMonth(location.state.initialMonth);
            return date;
        }
        return new Date();
    };

    // State
    const [selectedDate, setSelectedDate] = useState(getInitialDate());
    const [processing, setProcessing] = useState(false);
    const [invoiceTransactions, setInvoiceTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch invoice transactions from Supabase
    const fetchInvoiceTransactions = async () => {
        setLoading(true);
        try {
            // Format invoice month as first day of month (YYYY-MM-DD)
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const invoiceMonth = `${year}-${month}-01`;

            const { data, error } = await supabase
                .from('transactions')
                .select('id, description, amount, date, invoice_date, card_id, is_paid, category, type')
                .eq('card_id', cardId)
                .eq('type', 'expense')
                .eq('invoice_date', invoiceMonth)
                .order('date', { ascending: false });

            if (error) throw error;
            setInvoiceTransactions(data || []);
        } catch (error) {
            console.error('Error fetching invoice transactions:', error);
            setInvoiceTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cardId) {
            fetchInvoiceTransactions();
        }
    }, [cardId, selectedDate]);

    const card = cards.find(c => c.id === cardId);

    if (!card) return <div className="container" style={{ paddingTop: '40px' }}>Cartão não encontrado.</div>;

    const hasPendingItems = invoiceTransactions.some(t => !t.is_paid);

    const handlePayInvoice = async () => {
        if (!hasPendingItems) return;

        const pendingCount = invoiceTransactions.filter(t => !t.is_paid).length;
        const confirmMsg = `Deseja marcar esta fatura (${monthName}) como PAGA?\n\nIsso marcará todos os ${pendingCount} lançamentos como pagos.`;
        if (!window.confirm(confirmMsg)) return;

        setProcessing(true);
        try {
            // Format invoice month as first day of month (YYYY-MM-DD)
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const invoiceMonth = `${year}-${month}-01`;

            // Call RPC function
            const { data, error } = await supabase.rpc('pay_card_invoice', {
                p_card_id: cardId,
                p_invoice_month: invoiceMonth
            });

            if (error) throw error;

            alert(`Fatura marcada como paga com sucesso! ${data} transações atualizadas.`);

            // Auto-advance to next month
            const newDate = new Date(selectedDate);
            newDate.setMonth(selectedDate.getMonth() + 1);
            setSelectedDate(newDate);
        } catch (error) {
            console.error('Error paying invoice:', error);
            alert('Erro ao pagar fatura: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleReopenInvoice = async () => {
        if (invoiceTransactions.length === 0) return;

        if (!window.confirm(`Deseja REABRIR esta fatura de ${monthName}?\n\nIsso marcará todos os itens como pendentes novamente.`)) return;

        setProcessing(true);
        try {
            // Update each paid transaction to unpaid
            const paidTransactions = invoiceTransactions.filter(t => t.is_paid);

            for (const transaction of paidTransactions) {
                const { error } = await supabase
                    .from('transactions')
                    .update({ is_paid: false, updated_at: new Date().toISOString() })
                    .eq('id', transaction.id);

                if (error) throw error;
            }

            alert('Fatura reaberta com sucesso!');
            await fetchInvoiceTransactions();
        } catch (error) {
            console.error('Error reopening invoice:', error);
            alert('Erro ao reabrir fatura: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    // Calculate Total Invoice
    const totalInvoice = invoiceTransactions.reduce((acc, t) => acc + Number(t.amount), 0);

    const handlePrevMonth = () => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(selectedDate.getMonth() - 1);
        setSelectedDate(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(selectedDate.getMonth() + 1);
        setSelectedDate(newDate);
    };

    // Calculate the "True" Current Invoice Date based on closing day
    const getCurrentInvoiceDate = () => {
        const today = new Date();
        const closingDay = card.closing_day || card.closingDay || 1;

        // Regra: dia < fechamento → fatura do mês atual
        //        dia >= fechamento → fatura do mês seguinte
        if (today.getDate() >= closingDay) {
            const nextMonth = new Date(today);
            nextMonth.setMonth(today.getMonth() + 1);
            return nextMonth;
        }
        return today;
    };

    const currentInvoiceDate = getCurrentInvoiceDate();
    const isViewingCurrentInvoice =
        selectedDate.getMonth() === currentInvoiceDate.getMonth() &&
        selectedDate.getFullYear() === currentInvoiceDate.getFullYear();

    const handleCurrentMonth = () => {
        setSelectedDate(currentInvoiceDate);
    };

    const monthName = selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // --- Styles & Design ---
    const primaryColor = card ? (card.color || 'var(--primary)') : 'var(--primary)';

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '100px', marginTop: '24px' }}>

            {/* Header with Navigation Integration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>

                {/* Top Row: Back & Title */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{
                                background: 'var(--bg-secondary)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px', height: '40px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'var(--text-primary)',
                                transition: 'background 0.2s'
                            }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: '1.2' }}>{card.name}</h1>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fatura de Cartão de Crédito</div>
                        </div>
                    </div>

                    {/* Current Button (Floating pill) */}
                    {!isViewingCurrentInvoice && (
                        <button
                            onClick={handleCurrentMonth}
                            className="btn animate-scale-in"
                            style={{
                                background: primaryColor, color: '#fff',
                                border: 'none', borderRadius: '20px',
                                padding: '8px 16px', fontSize: '0.75rem', fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <Calendar size={14} /> Atual
                        </button>
                    )}
                </div>

                {/* Month Navigator (Pill Style) */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifySelf: 'center', alignSelf: 'center',
                    background: 'var(--bg-secondary)', padding: '4px', borderRadius: '32px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                    <button
                        onClick={handlePrevMonth}
                        style={{
                            width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div style={{ padding: '0 24px', fontWeight: '600', color: 'var(--text-primary)', minWidth: '140px', textAlign: 'center' }}>
                        {capitalizedMonthName}
                    </div>
                    <button
                        onClick={handleNextMonth}
                        style={{
                            width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Hero Summary Card */}
            <div className="card hover-scale" style={{
                padding: '32px',
                marginBottom: '32px',
                background: hasPendingItems ? 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)' : 'linear-gradient(135deg, rgba(52, 199, 89, 0.05) 0%, rgba(52, 199, 89, 0.1) 100%)',
                border: hasPendingItems ? '1px solid var(--border)' : '1px solid rgba(52, 199, 89, 0.2)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Total da Fatura
                    </div>
                    <div style={{
                        fontSize: '3rem',
                        fontWeight: '800',
                        color: hasPendingItems ? 'var(--text-primary)' : 'var(--success)',
                        letterSpacing: '-1px',
                        marginBottom: '24px'
                    }}>
                        R$ {totalInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>

                    {/* Action Area */}
                    {hasPendingItems ? (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={handlePayInvoice}
                                disabled={processing}
                                style={{
                                    background: 'var(--text-primary)', color: '#fff',
                                    border: 'none', borderRadius: '16px',
                                    padding: '16px 48px', fontSize: '1rem', fontWeight: '600',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    transform: 'scale(1)', transition: 'all 0.2s'
                                }}
                            >
                                {processing ? 'Processando...' : (
                                    <>
                                        <CheckCircle size={20} /> Marcar como Paga
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        invoiceTransactions.length > 0 && (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    background: 'var(--success)', color: '#fff',
                                    padding: '8px 16px', borderRadius: '20px',
                                    fontSize: '0.9rem', fontWeight: '700',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)'
                                }}>
                                    <CheckCircle size={16} /> Fatura Paga
                                </div>
                                <button
                                    onClick={handleReopenInvoice}
                                    style={{
                                        color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500',
                                        background: 'transparent', border: 'none', textDecoration: 'underline', cursor: 'pointer',
                                        marginTop: '4px'
                                    }}
                                >
                                    Reabrir Fatura
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Transactions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Lançamentos</h3>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{invoiceTransactions.length} itens</span>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</div>
                ) : invoiceTransactions.length === 0 ? (
                    <div className="card" style={{ padding: '40px', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Nenhuma despesa nesta fatura.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {invoiceTransactions.map(t => (
                            <div key={t.id} className="card hover-scale" style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px 20px', borderRadius: '16px',
                                border: '1px solid var(--border)',
                                transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '12px',
                                        background: 'var(--bg-secondary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--text-primary)'
                                    }}>
                                        <ShoppingBag size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                                            {t.description}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <span>{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                            <span>•</span>
                                            <span>{t.category || 'Geral'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                        R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    {!t.is_paid && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: '600', marginTop: '2px' }}>
                                            PENDENTE
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
