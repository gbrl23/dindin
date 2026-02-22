import { useMemo } from 'react';
import { parseLocalDate } from '../utils/dateUtils';

/**
 * Filter transactions by period, category, and type
 */
export function filterTransactions(transactions, filters) {
    if (!transactions || !filters) return [];

    const { startDate, endDate, categoryIds, type } = filters;
    if (!startDate || !endDate) return [];

    return transactions.filter(tx => {
        // Date filter — use invoice_date for credit card expenses, competence_date for bills, else date
        let dateStr = tx.date;
        if (tx.type === 'expense' && tx.card_id && tx.invoice_date) {
            dateStr = tx.invoice_date;
        } else if (tx.competence_date) {
            dateStr = tx.competence_date;
        }
        if (!dateStr) return false;
        const txDate = dateStr.substring(0, 10);
        if (txDate < startDate || txDate > endDate) return false;

        // Type filter
        if (type && type !== 'all') {
            if (type === 'expense' && tx.type !== 'expense' && tx.type !== 'bill') return false;
            if (type === 'income' && tx.type !== 'income') return false;
            if (type === 'investment' && tx.type !== 'investment') return false;
        }

        // Category filter
        if (categoryIds && categoryIds.length > 0) {
            if (!categoryIds.includes(tx.category_id)) return false;
        }

        return true;
    });
}

/**
 * Calculate summary stats from filtered transactions
 */
export function calculateSummary(transactions) {
    if (!transactions || transactions.length === 0) {
        return { totalIncome: 0, totalExpenses: 0, balance: 0, count: 0 };
    }

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(tx => {
        const amount = Number(tx.amount) || 0;
        if (tx.type === 'income') {
            totalIncome += amount;
        } else {
            totalExpenses += amount;
        }
    });

    return {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        balance: Math.round((totalIncome - totalExpenses) * 100) / 100,
        count: transactions.length,
    };
}

/**
 * Group transactions by category with subtotals
 */
export function getCategoryBreakdown(transactions) {
    if (!transactions || transactions.length === 0) return [];

    const map = {};
    let totalExpenses = 0;

    transactions.forEach(tx => {
        if (tx.type === 'income') return; // Only break down expenses
        const amount = Number(tx.amount) || 0;
        const catId = tx.category_id || 'uncategorized';
        const catName = tx.category_details?.name || tx.category || 'Sem categoria';
        const catIcon = tx.category_details?.icon || '📦';
        const catColor = tx.category_details?.color || '#A0A0A0';

        if (!map[catId]) {
            map[catId] = {
                categoryId: catId,
                name: catName,
                icon: catIcon,
                color: catColor,
                total: 0,
                count: 0,
                transactions: [],
            };
        }
        map[catId].total += amount;
        map[catId].count += 1;
        map[catId].transactions.push(tx);
        totalExpenses += amount;
    });

    return Object.values(map)
        .map(cat => ({
            ...cat,
            total: Math.round(cat.total * 100) / 100,
            percentage: totalExpenses > 0
                ? Math.round((cat.total / totalExpenses) * 1000) / 10
                : 0,
        }))
        .sort((a, b) => b.total - a.total);
}

/**
 * Generate cumulative chart data for a date range
 */
export function getTimelineData(transactions, startDate, endDate) {
    if (!transactions || !startDate || !endDate) {
        return { labels: [], incomeData: [], expenseData: [] };
    }

    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const dayCount = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // For ranges > 60 days, group by week; for > 180 days, group by month
    if (dayCount > 180) {
        return getMonthlyTimeline(transactions, startDate, endDate);
    }
    if (dayCount > 60) {
        return getWeeklyTimeline(transactions, startDate, endDate);
    }
    return getDailyTimeline(transactions, startDate, endDate, dayCount);
}

function getDailyTimeline(transactions, startDate, endDate, dayCount) {
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    let cumIncome = 0;
    let cumExpense = 0;

    const start = parseLocalDate(startDate);

    for (let i = 0; i < dayCount; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dayStr = String(d.getDate());
        labels.push(dayStr);

        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        transactions.forEach(tx => {
            const txDate = tx.date?.substring(0, 10);
            if (txDate === dateKey) {
                if (tx.type === 'income') {
                    cumIncome += Number(tx.amount) || 0;
                } else {
                    cumExpense += Number(tx.amount) || 0;
                }
            }
        });

        incomeData.push(Math.round(cumIncome * 100) / 100);
        expenseData.push(Math.round(cumExpense * 100) / 100);
    }

    return { labels, incomeData, expenseData };
}

function getWeeklyTimeline(transactions, startDate, endDate) {
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    let cumIncome = 0;
    let cumExpense = 0;

    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    let current = new Date(start);
    let week = 1;

    while (current <= end) {
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > end) weekEnd.setTime(end.getTime());

        const weekStartStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;

        transactions.forEach(tx => {
            const txDate = tx.date?.substring(0, 10);
            if (txDate >= weekStartStr && txDate <= weekEndStr) {
                if (tx.type === 'income') cumIncome += Number(tx.amount) || 0;
                else cumExpense += Number(tx.amount) || 0;
            }
        });

        labels.push(`S${week}`);
        incomeData.push(Math.round(cumIncome * 100) / 100);
        expenseData.push(Math.round(cumExpense * 100) / 100);

        current.setDate(current.getDate() + 7);
        week++;
    }

    return { labels, incomeData, expenseData };
}

function getMonthlyTimeline(transactions, startDate, endDate) {
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    let cumIncome = 0;
    let cumExpense = 0;

    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    let current = new Date(start.getFullYear(), start.getMonth(), 1, 12);

    while (current <= end) {
        const monthStr = current.toLocaleString('pt-BR', { month: 'short' });
        const yearMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

        transactions.forEach(tx => {
            const txMonth = tx.date?.substring(0, 7);
            if (txMonth === yearMonth) {
                if (tx.type === 'income') cumIncome += Number(tx.amount) || 0;
                else cumExpense += Number(tx.amount) || 0;
            }
        });

        labels.push(monthStr);
        incomeData.push(Math.round(cumIncome * 100) / 100);
        expenseData.push(Math.round(cumExpense * 100) / 100);

        current.setMonth(current.getMonth() + 1);
    }

    return { labels, incomeData, expenseData };
}

/**
 * Hook: useReports — filters and aggregates transaction data for reports
 */
export function useReports(transactions, filters) {
    const filtered = useMemo(
        () => filterTransactions(transactions, filters),
        [transactions, filters]
    );

    const summary = useMemo(
        () => calculateSummary(filtered),
        [filtered]
    );

    const categoryBreakdown = useMemo(
        () => getCategoryBreakdown(filtered),
        [filtered]
    );

    const timeline = useMemo(
        () => getTimelineData(filtered, filters?.startDate, filters?.endDate),
        [filtered, filters?.startDate, filters?.endDate]
    );

    return { filtered, summary, categoryBreakdown, timeline };
}

export default useReports;
