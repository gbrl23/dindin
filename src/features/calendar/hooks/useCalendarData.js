import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '../../../hooks/useTransactions';
import { useCards } from '../../../hooks/useCards';
import { displayDate, formatLocalDate } from '../../../utils/dateUtils';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useCalendarData = (selectedDate, filters = {}) => {
    const { transactions = [] } = useTransactions() || {};
    const { cards = [] } = useCards() || {};

    // Filter transactions before aggregation
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            // Type Filter
            if (filters.type && filters.type !== 'all') {
                if (tx.type !== filters.type) return false;
            }
            return true;
        });
    }, [transactions, filters.type]);

    // 1. Generate Days for the Selected Month Grid
    const calendarDays = useMemo(() => {
        if (!selectedDate) return [];
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        return eachDayOfInterval({ start, end });
    }, [selectedDate]);

    // 2. Aggregate Data per Day
    const daysData = useMemo(() => {
        const dataMap = {};

        // Initialize Map
        calendarDays.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            dataMap[dateStr] = {
                date: day,
                dateStr,
                income: 0,
                expense: 0,
                bill: 0,
                investment: 0,
                transactions: [],
                events: [],
                // Type flags for UI indicators
                hasIncome: false,
                hasExpense: false,
                hasBill: false,
                hasInvestment: false
            };
        });

        // Add Transactions
        filteredTransactions.forEach(tx => {
            // Check if valid date first
            if (!tx.date) return;

            const dateStr = tx.date;

            if (dataMap[dateStr]) {
                const amount = Number(tx.amount);
                const type = tx.type || 'expense'; // Default fallback

                if (type === 'income') {
                    dataMap[dateStr].income += amount;
                    dataMap[dateStr].hasIncome = true;
                } else if (type === 'bill') {
                    dataMap[dateStr].bill += amount;
                    dataMap[dateStr].hasBill = true;
                } else if (type === 'investment') {
                    dataMap[dateStr].investment += amount;
                    dataMap[dateStr].hasInvestment = true;
                } else {
                    // Fallback: Expense (includes explicit 'expense' and unknown types)
                    dataMap[dateStr].expense += amount;
                    dataMap[dateStr].hasExpense = true;
                }

                dataMap[dateStr].transactions.push(tx);
            }
        });

        // Add Closing Dates (Card)
        cards.forEach(card => {
            if (card.closing_day) {
                // Heuristic: If closing day is '5', we show it on the 5th of THIS month
                const year = selectedDate.getFullYear();
                const month = selectedDate.getMonth(); // 0-11
                const closingDate = new Date(year, month, parseInt(card.closing_day));

                // Format to YYYY-MM-DD local
                const dateStr = format(closingDate, 'yyyy-MM-dd');

                if (dataMap[dateStr]) {
                    dataMap[dateStr].events.push({
                        type: 'closing',
                        title: `Fechamento ${card.name}`,
                        color: 'orange'
                    });
                }
            }
            if (card.due_day) {
                const year = selectedDate.getFullYear();
                const month = selectedDate.getMonth();
                const due_day = parseInt(card.due_day);
                // Handle leap years later if needed, simple logic for now
                const dueDate = new Date(year, month, due_day);
                const dateStr = format(dueDate, 'yyyy-MM-dd');

                if (dataMap[dateStr]) {
                    dataMap[dateStr].events.push({
                        type: 'due',
                        title: `Vencimento ${card.name}`,
                        color: 'red'
                    });
                }
            }
        });

        return dataMap;
    }, [filteredTransactions, cards, calendarDays, selectedDate]);

    return {
        calendarDays,
        daysData
    };
};
