import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCards } from '../hooks/useCards';

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

export function DashboardProvider({ children }) {
    // Smart Initial Date Logic
    const getSmartInitialDate = () => {
        const today = new Date();
        const currentDay = today.getDate();
        const cachedClosingDay = parseInt(localStorage.getItem('latest_closing_day') || '0');

        if (cachedClosingDay > 0 && currentDay >= cachedClosingDay) {
            const nextMonth = new Date(today);
            nextMonth.setMonth(today.getMonth() + 1);
            return nextMonth;
        }
        return today;
    };

    const [selectedDate, setSelectedDate] = useState(getSmartInitialDate());

    // Modal State
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [modalType, setModalType] = useState('expense'); // expense, income, investment, bill

    const { cards = [] } = useCards() || {};

    // Auto-advance logic (sync with cards if loaded later)
    useEffect(() => {
        if (cards && Array.isArray(cards) && cards.length > 0) {
            const today = new Date();
            const currentDay = today.getDate();
            const latestClosingDay = cards.reduce((max, card) => Math.max(max, card.closing_day || 1), 1);

            localStorage.setItem('latest_closing_day', latestClosingDay.toString());
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
        setSelectedDate(getSmartInitialDate());
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
