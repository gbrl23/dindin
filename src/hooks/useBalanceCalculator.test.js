import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBalanceCalculator } from './useBalanceCalculator';

// Helper to create a transaction
const createTx = (overrides = {}) => ({
    id: 'tx-1',
    type: 'expense',
    amount: 100,
    date: '2026-02-15',
    payer_id: 'profile-me',
    card_id: null,
    invoice_date: null,
    competence_date: null,
    shares: [],
    ...overrides,
});

// Helper to create a share
const createShare = (profileId, amount) => ({
    profile_id: profileId,
    share_amount: amount,
});

const MY_PROFILE = 'profile-me';
const OTHER_PROFILE = 'profile-other';
const GHOST_PROFILE = 'profile-ghost';
const FEB_2026 = new Date(2026, 1, 1); // February 2026

describe('useBalanceCalculator', () => {
    describe('null/empty inputs', () => {
        it('returns zeros when transactions is null', () => {
            const { result } = renderHook(() =>
                useBalanceCalculator(null, MY_PROFILE, FEB_2026)
            );
            expect(result.current).toEqual({
                myExpenses: 0,
                totalAReceber: 0,
                totalAPagar: 0,
                netBalance: 0,
            });
        });

        it('returns zeros when myProfileId is null', () => {
            const { result } = renderHook(() =>
                useBalanceCalculator([], null, FEB_2026)
            );
            expect(result.current).toEqual({
                myExpenses: 0,
                totalAReceber: 0,
                totalAPagar: 0,
                netBalance: 0,
            });
        });

        it('returns zeros when selectedDate is null', () => {
            const { result } = renderHook(() =>
                useBalanceCalculator([], MY_PROFILE, null)
            );
            expect(result.current).toEqual({
                myExpenses: 0,
                totalAReceber: 0,
                totalAPagar: 0,
                netBalance: 0,
            });
        });

        it('returns zeros for empty transactions list', () => {
            const { result } = renderHook(() =>
                useBalanceCalculator([], MY_PROFILE, FEB_2026)
            );
            expect(result.current).toEqual({
                myExpenses: 0,
                totalAReceber: 0,
                totalAPagar: 0,
                netBalance: 0,
            });
        });
    });

    describe('simple expenses (no shares)', () => {
        it('calculates myExpenses for my own payment', () => {
            const txs = [createTx({ amount: 150, payer_id: MY_PROFILE })];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(150);
        });

        it('does not count expenses paid by others', () => {
            const txs = [createTx({ amount: 200, payer_id: OTHER_PROFILE })];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(0);
        });

        it('sums multiple expenses in the month', () => {
            const txs = [
                createTx({ id: 'tx-1', amount: 50, date: '2026-02-01' }),
                createTx({ id: 'tx-2', amount: 75.50, date: '2026-02-28' }),
                createTx({ id: 'tx-3', amount: 24.50, date: '2026-02-15' }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(150);
        });
    });

    describe('month filtering', () => {
        it('excludes transactions from other months', () => {
            const txs = [
                createTx({ id: 'tx-feb', amount: 100, date: '2026-02-15' }),
                createTx({ id: 'tx-jan', amount: 200, date: '2026-01-15' }),
                createTx({ id: 'tx-mar', amount: 300, date: '2026-03-15' }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(100);
        });

        it('uses invoice_date for card expenses', () => {
            const txs = [
                createTx({
                    amount: 100,
                    card_id: 'card-1',
                    date: '2026-01-25',         // bought in Jan
                    invoice_date: '2026-02-05',  // invoiced in Feb
                }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(100); // should appear in Feb
        });

        it('uses competence_date when available (no card)', () => {
            const txs = [
                createTx({
                    amount: 100,
                    date: '2026-01-20',
                    competence_date: '2026-02-01',
                }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(100);
        });

        it('prefers invoice_date over competence_date for card expenses', () => {
            const txs = [
                createTx({
                    amount: 100,
                    card_id: 'card-1',
                    date: '2026-01-15',
                    competence_date: '2026-03-01',
                    invoice_date: '2026-02-05',
                }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(100); // invoice_date wins
        });
    });

    describe('transaction types', () => {
        it('ignores income transactions', () => {
            const txs = [
                createTx({ type: 'income', amount: 5000 }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(0);
        });

        it('includes bill type transactions', () => {
            const txs = [
                createTx({ type: 'bill', amount: 200 }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(200);
        });

        it('includes investment type transactions', () => {
            const txs = [
                createTx({ type: 'investment', amount: 500 }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(500);
        });
    });

    describe('shared expenses (a receber)', () => {
        it('calculates totalAReceber when I paid and others owe me', () => {
            const txs = [
                createTx({
                    amount: 300,
                    payer_id: MY_PROFILE,
                    shares: [
                        createShare(MY_PROFILE, 100),
                        createShare(OTHER_PROFILE, 100),
                        createShare(GHOST_PROFILE, 100),
                    ],
                }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(100);       // my share
            expect(result.current.totalAReceber).toBe(200);    // other + ghost owe me
            expect(result.current.totalAPagar).toBe(0);
            expect(result.current.netBalance).toBe(200);
        });
    });

    describe('shared expenses (a pagar)', () => {
        it('calculates totalAPagar when others paid and I owe', () => {
            const txs = [
                createTx({
                    amount: 200,
                    payer_id: OTHER_PROFILE,
                    shares: [
                        createShare(MY_PROFILE, 100),
                        createShare(OTHER_PROFILE, 100),
                    ],
                }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(100);
            expect(result.current.totalAReceber).toBe(0);
            expect(result.current.totalAPagar).toBe(100);
            expect(result.current.netBalance).toBe(-100);
        });
    });

    describe('shared expenses with ghost profiles', () => {
        it('handles ghost profile shares in the calculation', () => {
            const txs = [
                createTx({
                    amount: 300,
                    payer_id: MY_PROFILE,
                    shares: [
                        createShare(MY_PROFILE, 100),
                        createShare(GHOST_PROFILE, 200),
                    ],
                }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(100);
            expect(result.current.totalAReceber).toBe(200);
        });
    });

    describe('decimal precision', () => {
        it('rounds to 2 decimal places', () => {
            const txs = [
                createTx({ id: 'tx-1', amount: 10.005 }),
                createTx({ id: 'tx-2', amount: 20.115 }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            // 10.005 + 20.115 = 30.12 (rounded)
            expect(result.current.myExpenses).toBe(30.12);
        });

        it('handles share amounts with many decimals', () => {
            const txs = [
                createTx({
                    amount: 100,
                    payer_id: MY_PROFILE,
                    shares: [
                        createShare(MY_PROFILE, 33.333),
                        createShare(OTHER_PROFILE, 33.333),
                        createShare(GHOST_PROFILE, 33.334),
                    ],
                }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(33.33);
            expect(result.current.totalAReceber).toBe(66.67);
        });
    });

    describe('complex scenarios', () => {
        it('calculates mixed transactions correctly', () => {
            const txs = [
                // I paid dinner, split with friend
                createTx({
                    id: 'dinner',
                    amount: 200,
                    payer_id: MY_PROFILE,
                    shares: [
                        createShare(MY_PROFILE, 100),
                        createShare(OTHER_PROFILE, 100),
                    ],
                }),
                // Friend paid gas, split with me
                createTx({
                    id: 'gas',
                    amount: 80,
                    payer_id: OTHER_PROFILE,
                    shares: [
                        createShare(MY_PROFILE, 40),
                        createShare(OTHER_PROFILE, 40),
                    ],
                }),
                // My solo bill
                createTx({
                    id: 'rent',
                    type: 'bill',
                    amount: 1500,
                    payer_id: MY_PROFILE,
                }),
            ];
            const { result } = renderHook(() =>
                useBalanceCalculator(txs, MY_PROFILE, FEB_2026)
            );
            expect(result.current.myExpenses).toBe(1640);     // 100 + 40 + 1500
            expect(result.current.totalAReceber).toBe(100);   // friend owes me from dinner
            expect(result.current.totalAPagar).toBe(40);      // I owe friend from gas
            expect(result.current.netBalance).toBe(60);       // 100 - 40
        });
    });
});
