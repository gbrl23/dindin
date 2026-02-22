import { describe, it, expect } from 'vitest';
import { getBudgetStatus, getBudgetsWithProgress } from './useBudgets';

describe('getBudgetStatus', () => {
    it('returns "healthy" for 0%', () => {
        expect(getBudgetStatus(0)).toBe('healthy');
    });

    it('returns "healthy" for 74%', () => {
        expect(getBudgetStatus(74)).toBe('healthy');
    });

    it('returns "warning" for 75%', () => {
        expect(getBudgetStatus(75)).toBe('warning');
    });

    it('returns "warning" for 89%', () => {
        expect(getBudgetStatus(89)).toBe('warning');
    });

    it('returns "critical" for 90%', () => {
        expect(getBudgetStatus(90)).toBe('critical');
    });

    it('returns "critical" for 99%', () => {
        expect(getBudgetStatus(99)).toBe('critical');
    });

    it('returns "exceeded" for 100%', () => {
        expect(getBudgetStatus(100)).toBe('exceeded');
    });

    it('returns "exceeded" for 150%', () => {
        expect(getBudgetStatus(150)).toBe('exceeded');
    });
});

describe('getBudgetsWithProgress', () => {
    const makeBudget = (overrides = {}) => ({
        id: 'budget-1',
        user_id: 'user-1',
        category_id: 'cat-food',
        amount: 1000,
        month: '2026-02',
        category: { id: 'cat-food', name: 'Alimentacao', icon: '🍔', color: '#f97316', type: 'expense' },
        ...overrides,
    });

    const makeTx = (overrides = {}) => ({
        id: 'tx-1',
        type: 'expense',
        amount: 100,
        date: '2026-02-15',
        invoice_date: null,
        category_id: 'cat-food',
        ...overrides,
    });

    it('returns empty array for null budgets', () => {
        expect(getBudgetsWithProgress(null, [], '2026-02')).toEqual([]);
    });

    it('returns empty array for null transactions', () => {
        expect(getBudgetsWithProgress([], null, '2026-02')).toEqual([]);
    });

    it('returns empty array for null month', () => {
        expect(getBudgetsWithProgress([], [], null)).toEqual([]);
    });

    it('calculates zero spent when no matching transactions', () => {
        const budgets = [makeBudget()];
        const result = getBudgetsWithProgress(budgets, [], '2026-02');

        expect(result[0].spent).toBe(0);
        expect(result[0].remaining).toBe(1000);
        expect(result[0].percentage).toBe(0);
        expect(result[0].status).toBe('healthy');
    });

    it('sums expenses for the matching category and month', () => {
        const budgets = [makeBudget({ amount: 1000 })];
        const txs = [
            makeTx({ id: 'tx-1', amount: 200 }),
            makeTx({ id: 'tx-2', amount: 300 }),
            makeTx({ id: 'tx-3', amount: 100 }),
        ];
        const result = getBudgetsWithProgress(budgets, txs, '2026-02');

        expect(result[0].spent).toBe(600);
        expect(result[0].remaining).toBe(400);
        expect(result[0].percentage).toBe(60);
        expect(result[0].status).toBe('healthy');
    });

    it('ignores transactions from other categories', () => {
        const budgets = [makeBudget({ category_id: 'cat-food' })];
        const txs = [
            makeTx({ category_id: 'cat-food', amount: 200 }),
            makeTx({ category_id: 'cat-transport', amount: 500 }),
        ];
        const result = getBudgetsWithProgress(budgets, txs, '2026-02');

        expect(result[0].spent).toBe(200);
    });

    it('ignores income transactions', () => {
        const budgets = [makeBudget()];
        const txs = [
            makeTx({ type: 'expense', amount: 200 }),
            makeTx({ type: 'income', amount: 5000 }),
        ];
        const result = getBudgetsWithProgress(budgets, txs, '2026-02');

        expect(result[0].spent).toBe(200);
    });

    it('ignores transactions from other months', () => {
        const budgets = [makeBudget()];
        const txs = [
            makeTx({ date: '2026-02-15', amount: 200 }),
            makeTx({ date: '2026-01-15', amount: 500 }),
            makeTx({ date: '2026-03-15', amount: 300 }),
        ];
        const result = getBudgetsWithProgress(budgets, txs, '2026-02');

        expect(result[0].spent).toBe(200);
    });

    it('uses invoice_date when available for month matching', () => {
        const budgets = [makeBudget({ month: '2026-03' })];
        const txs = [
            // Bought in Feb but invoiced in March
            makeTx({ date: '2026-02-25', invoice_date: '2026-03-01', amount: 300 }),
        ];
        const result = getBudgetsWithProgress(budgets, txs, '2026-03');

        expect(result[0].spent).toBe(300);
    });

    it('returns warning status at 75%', () => {
        const budgets = [makeBudget({ amount: 1000 })];
        const txs = [makeTx({ amount: 750 })];
        const result = getBudgetsWithProgress(budgets, txs, '2026-02');

        expect(result[0].percentage).toBe(75);
        expect(result[0].status).toBe('warning');
    });

    it('returns critical status at 90%', () => {
        const budgets = [makeBudget({ amount: 1000 })];
        const txs = [makeTx({ amount: 900 })];
        const result = getBudgetsWithProgress(budgets, txs, '2026-02');

        expect(result[0].percentage).toBe(90);
        expect(result[0].status).toBe('critical');
    });

    it('returns exceeded status over 100%', () => {
        const budgets = [makeBudget({ amount: 1000 })];
        const txs = [makeTx({ amount: 1200 })];
        const result = getBudgetsWithProgress(budgets, txs, '2026-02');

        expect(result[0].percentage).toBe(120);
        expect(result[0].status).toBe('exceeded');
    });

    it('handles multiple budgets independently', () => {
        const budgets = [
            makeBudget({ id: 'b-1', category_id: 'cat-food', amount: 1000 }),
            makeBudget({ id: 'b-2', category_id: 'cat-transport', amount: 500,
                category: { id: 'cat-transport', name: 'Transporte', icon: '🚗', color: '#3b82f6', type: 'expense' },
            }),
        ];
        const txs = [
            makeTx({ category_id: 'cat-food', amount: 800 }),
            makeTx({ category_id: 'cat-transport', amount: 450 }),
        ];
        const result = getBudgetsWithProgress(budgets, txs, '2026-02');

        expect(result[0].spent).toBe(800);
        expect(result[0].status).toBe('warning'); // 80%
        expect(result[1].spent).toBe(450);
        expect(result[1].status).toBe('critical'); // 90%
    });

    it('rounds to 2 decimal places', () => {
        const budgets = [makeBudget({ amount: 300 })];
        const txs = [
            makeTx({ id: 'tx-1', amount: 33.33 }),
            makeTx({ id: 'tx-2', amount: 33.33 }),
            makeTx({ id: 'tx-3', amount: 33.34 }),
        ];
        const result = getBudgetsWithProgress(budgets, txs, '2026-02');

        expect(result[0].spent).toBe(100);
        expect(result[0].remaining).toBe(200);
    });

    it('preserves original budget fields', () => {
        const budget = makeBudget({ amount: 1000 });
        const result = getBudgetsWithProgress([budget], [], '2026-02');

        expect(result[0].id).toBe('budget-1');
        expect(result[0].category.name).toBe('Alimentacao');
        expect(result[0].amount).toBe(1000);
    });
});
