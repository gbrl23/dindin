import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useCards } from '../hooks/useCards';
import { getInvoiceMonth, getTodayLocal } from '../utils/dateUtils';

const DashboardContext = createContext({
    selectedDate: new Date(),
    setSelectedDate: () => { },
    handlePrevMonth: () => { },
    handleNextMonth: () => { },
    handleSetToday: () => { },
    isTransactionModalOpen: false,
    openTransactionModal: () => { },
    closeTransactionModal: () => { },
    modalType: 'expense'
});

/**
 * Calculate the financial month based on the user's card closing day and due day.
 * Uses getInvoiceMonth to determine which month today's purchase would go to.
 * That's the month the dashboard should show.
 */
function getFinancialMonth(closingDay, dueDay) {
    const today = getTodayLocal(); // YYYY-MM-DD
    if (!closingDay || closingDay <= 0) {
        return new Date(); // No card → current calendar month
    }
    const invoiceDate = getInvoiceMonth(today, closingDay, dueDay);
    if (!invoiceDate) return new Date();

    // invoiceDate is YYYY-MM, parse it
    const [year, month] = invoiceDate.split('-').map(Number);
    return new Date(year, month - 1, 1, 12, 0, 0);
}

export function DashboardProvider({ children }) {
    // Smart Initial Date: use cached closing_day/due_day for instant render
    const getSmartInitialDate = () => {
        const cachedClosingDay = parseInt(localStorage.getItem('latest_closing_day') || '0');
        const cachedDueDay = parseInt(localStorage.getItem('latest_due_day') || '0');
        return getFinancialMonth(cachedClosingDay, cachedDueDay || undefined);
    };

    const [selectedDate, setSelectedDate] = useState(getSmartInitialDate);
    const hasInitialized = useRef(false);

    // Modal State
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [modalType, setModalType] = useState('expense');

    const { cards = [] } = useCards() || {};

    // When cards load, recalculate the financial month and update if needed
    useEffect(() => {
        if (cards && Array.isArray(cards) && cards.length > 0) {
            // Use the card with the latest closing day to determine financial month
            const mainCard = cards.reduce((best, card) =>
                (card.closing_day || 1) > (best.closing_day || 1) ? card : best
                , cards[0]);

            const latestClosingDay = mainCard.closing_day || 1;
            const latestDueDay = mainCard.due_day;

            localStorage.setItem('latest_closing_day', latestClosingDay.toString());
            if (latestDueDay) localStorage.setItem('latest_due_day', latestDueDay.toString());

            // Only auto-set on first load (don't override user navigation)
            if (!hasInitialized.current) {
                hasInitialized.current = true;
                const financialDate = getFinancialMonth(latestClosingDay, latestDueDay);
                setSelectedDate(prev => {
                    // Only update if the month actually differs from what we cached
                    if (prev.getMonth() !== financialDate.getMonth() || prev.getFullYear() !== financialDate.getFullYear()) {
                        return financialDate;
                    }
                    return prev;
                });
            }
        }
    }, [cards]);

    const handlePrevMonth = () => {
        setSelectedDate(prev => {
            const d = new Date(prev);
            d.setMonth(prev.getMonth() - 1);
            return d;
        });
    };

    const handleNextMonth = () => {
        setSelectedDate(prev => {
            const d = new Date(prev);
            d.setMonth(prev.getMonth() + 1);
            return d;
        });
    };

    const handleSetToday = () => {
        const cachedClosingDay = parseInt(localStorage.getItem('latest_closing_day') || '0');
        setSelectedDate(getFinancialMonth(cachedClosingDay));
    };

    // Modal Actions
    const openTransactionModal = (type = 'expense') => {
        setModalType(type);
        setIsTransactionModalOpen(true);
    };

    const closeTransactionModal = () => {
        setIsTransactionModalOpen(false);
    };

    return (
        <DashboardContext.Provider value={{
            selectedDate,
            setSelectedDate,
            handlePrevMonth,
            handleNextMonth,
            handleSetToday,
            isTransactionModalOpen,
            openTransactionModal,
            closeTransactionModal,
            modalType
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    return context || {};
}

