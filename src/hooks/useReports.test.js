import { describe, it, expect } from 'vitest';
import { filterTransactions, calculateSummary, getCategoryBreakdown, getTimelineData } from './useReports';

const makeTx = (overrides = {}) => ({
    id: 'tx-1',
    type: 'expense',
    amount: 100,
    date: '2026-02-15',
    invoice_date: null,
    competence_date: null,
    card_id: null,
    category_id: 'cat-food',
    category: 'Alimentacao',
    category_details: { name: 'Alimentacao', icon: '🍔', color: '#f97316' },
    description: 'Almoço',
    ...overrides,
});

describe('filterTransactions', () => {
    const baseFilters = { startDate: '2026-02-01', endDate: '2026-02-28', categoryIds: [], type: 'all' };

    it('returns empty for null transactions', () => {
        expect(filterTransactions(null, baseFilters)).toEqual([]);
    });

    it('returns empty for null filters', () => {
        expect(filterTransactions([makeTx()], null)).toEqual([]);
    });

    it('returns empty for missing date range', () => {
        expect(filterTransactions([makeTx()], { startDate: '', endDate: '' })).toEqual([]);
    });

    it('filters by date range', () => {
        const txs = [
            makeTx({ id: '1', date: '2026-02-15' }),
            makeTx({ id: '2', date: '2026-01-15' }),
            makeTx({ id: '3', date: '2026-03-15' }),
        ];
        const result = filterTransactions(txs, baseFilters);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    it('uses invoice_date for credit card expenses', () => {
        const tx = makeTx({
            date: '2026-01-25',
            invoice_date: '2026-02-01',
            card_id: 'card-1',
            type: 'expense',
        });
        const result = filterTransactions([tx], baseFilters);
        expect(result).toHaveLength(1);
    });

    it('uses competence_date for bills', () => {
        const tx = makeTx({
            date: '2026-01-28',
            competence_date: '2026-02-01',
            type: 'bill',
        });
        const result = filterTransactions([tx], baseFilters);
        expect(result).toHaveLength(1);
    });

    it('filters by type: expense', () => {
        const txs = [
            makeTx({ id: '1', type: 'expense' }),
            makeTx({ id: '2', type: 'income' }),
            makeTx({ id: '3', type: 'bill' }),
        ];
        const result = filterTransactions(txs, { ...baseFilters, type: 'expense' });
        expect(result).toHaveLength(2); // expense + bill
    });

    it('filters by type: income', () => {
        const txs = [
            makeTx({ id: '1', type: 'expense' }),
            makeTx({ id: '2', type: 'income' }),
        ];
        const result = filterTransactions(txs, { ...baseFilters, type: 'income' });
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('income');
    });

    it('filters by category IDs', () => {
        const txs = [
            makeTx({ id: '1', category_id: 'cat-food' }),
            makeTx({ id: '2', category_id: 'cat-transport' }),
            makeTx({ id: '3', category_id: 'cat-food' }),
        ];
        const result = filterTransactions(txs, { ...baseFilters, categoryIds: ['cat-food'] });
        expect(result).toHaveLength(2);
    });

    it('returns all when categoryIds is empty', () => {
        const txs = [
            makeTx({ id: '1', category_id: 'cat-food' }),
            makeTx({ id: '2', category_id: 'cat-transport' }),
        ];
        const result = filterTransactions(txs, baseFilters);
        expect(result).toHaveLength(2);
    });
});

describe('calculateSummary', () => {
    it('returns zeros for empty array', () => {
        expect(calculateSummary([])).toEqual({ totalIncome: 0, totalExpenses: 0, balance: 0, count: 0 });
    });

    it('returns zeros for null', () => {
        expect(calculateSummary(null)).toEqual({ totalIncome: 0, totalExpenses: 0, balance: 0, count: 0 });
    });

    it('sums income and expenses separately', () => {
        const txs = [
            makeTx({ type: 'income', amount: 5000 }),
            makeTx({ type: 'expense', amount: 1200 }),
            makeTx({ type: 'expense', amount: 800 }),
            makeTx({ type: 'bill', amount: 500 }),
        ];
        const result = calculateSummary(txs);
        expect(result.totalIncome).toBe(5000);
        expect(result.totalExpenses).toBe(2500);
        expect(result.balance).toBe(2500);
        expect(result.count).toBe(4);
    });

    it('handles negative balance', () => {
        const txs = [
            makeTx({ type: 'income', amount: 1000 }),
            makeTx({ type: 'expense', amount: 3000 }),
        ];
        const result = calculateSummary(txs);
        expect(result.balance).toBe(-2000);
    });

    it('rounds to 2 decimal places', () => {
        const txs = [
            makeTx({ type: 'expense', amount: 33.33 }),
            makeTx({ type: 'expense', amount: 33.33 }),
            makeTx({ type: 'expense', amount: 33.34 }),
        ];
        const result = calculateSummary(txs);
        expect(result.totalExpenses).toBe(100);
    });
});

describe('getCategoryBreakdown', () => {
    it('returns empty for null', () => {
        expect(getCategoryBreakdown(null)).toEqual([]);
    });

    it('returns empty for empty array', () => {
        expect(getCategoryBreakdown([])).toEqual([]);
    });

    it('groups expenses by category', () => {
        const txs = [
            makeTx({ id: '1', category_id: 'cat-food', amount: 200, category_details: { name: 'Alimentacao', icon: '🍔', color: '#f97316' } }),
            makeTx({ id: '2', category_id: 'cat-food', amount: 300, category_details: { name: 'Alimentacao', icon: '🍔', color: '#f97316' } }),
            makeTx({ id: '3', category_id: 'cat-transport', amount: 500, category_details: { name: 'Transporte', icon: '🚗', color: '#3b82f6' } }),
        ];
        const result = getCategoryBreakdown(txs);
        expect(result).toHaveLength(2);
        // Sorted by total desc
        expect(result[0].name).toBe('Alimentacao');
        expect(result[0].total).toBe(500);
        expect(result[0].count).toBe(2);
        expect(result[1].name).toBe('Transporte');
        expect(result[1].total).toBe(500);
    });

    it('ignores income transactions', () => {
        const txs = [
            makeTx({ id: '1', type: 'expense', amount: 200 }),
            makeTx({ id: '2', type: 'income', amount: 5000 }),
        ];
        const result = getCategoryBreakdown(txs);
        expect(result).toHaveLength(1);
        expect(result[0].total).toBe(200);
    });

    it('calculates correct percentages', () => {
        const txs = [
            makeTx({ id: '1', category_id: 'cat-food', amount: 750 }),
            makeTx({ id: '2', category_id: 'cat-transport', amount: 250, category_details: { name: 'Transporte', icon: '🚗', color: '#3b82f6' } }),
        ];
        const result = getCategoryBreakdown(txs);
        expect(result[0].percentage).toBe(75);
        expect(result[1].percentage).toBe(25);
    });

    it('includes transactions list in each category', () => {
        const txs = [
            makeTx({ id: '1', category_id: 'cat-food', amount: 200 }),
            makeTx({ id: '2', category_id: 'cat-food', amount: 300 }),
        ];
        const result = getCategoryBreakdown(txs);
        expect(result[0].transactions).toHaveLength(2);
    });
});

describe('getTimelineData', () => {
    it('returns empty for null inputs', () => {
        const result = getTimelineData(null, '2026-02-01', '2026-02-28');
        expect(result).toEqual({ labels: [], incomeData: [], expenseData: [] });
    });

    it('generates daily data for short range', () => {
        const txs = [
            makeTx({ id: '1', type: 'expense', amount: 100, date: '2026-02-01' }),
            makeTx({ id: '2', type: 'income', amount: 500, date: '2026-02-03' }),
        ];
        const result = getTimelineData(txs, '2026-02-01', '2026-02-05');
        expect(result.labels).toHaveLength(5);
        expect(result.expenseData[0]).toBe(100); // Day 1 cumulative
        expect(result.incomeData[2]).toBe(500); // Day 3 cumulative
    });

    it('cumulative data always increases', () => {
        const txs = [
            makeTx({ id: '1', amount: 100, date: '2026-02-01' }),
            makeTx({ id: '2', amount: 200, date: '2026-02-03' }),
        ];
        const result = getTimelineData(txs, '2026-02-01', '2026-02-05');
        // Expense cumulative: 100, 100, 300, 300, 300
        expect(result.expenseData[0]).toBe(100);
        expect(result.expenseData[2]).toBe(300);
        expect(result.expenseData[4]).toBe(300);
    });
});
