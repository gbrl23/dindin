import { describe, it, expect } from 'vitest';
import { formatLocalDate, parseLocalDate, displayDateShort, getTodayLocal, getInvoiceMonth } from './dateUtils';

describe('formatLocalDate', () => {
    it('formats a date as YYYY-MM-DD', () => {
        const date = new Date(2026, 1, 15, 12, 0, 0); // Feb 15, 2026
        expect(formatLocalDate(date)).toBe('2026-02-15');
    });

    it('pads single-digit month and day', () => {
        const date = new Date(2026, 0, 5, 12, 0, 0); // Jan 5, 2026
        expect(formatLocalDate(date)).toBe('2026-01-05');
    });
});

describe('parseLocalDate', () => {
    it('parses YYYY-MM-DD string to Date at noon', () => {
        const date = parseLocalDate('2026-02-15');
        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(1); // February = 1
        expect(date.getDate()).toBe(15);
        expect(date.getHours()).toBe(12); // noon
    });

    it('returns current date when input is null/undefined', () => {
        const now = new Date();
        const result = parseLocalDate(null);
        expect(result.getFullYear()).toBe(now.getFullYear());
    });

    it('handles end of year correctly', () => {
        const date = parseLocalDate('2026-12-31');
        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(11); // December = 11
        expect(date.getDate()).toBe(31);
    });
});

describe('displayDateShort', () => {
    it('formats as DD/MM', () => {
        expect(displayDateShort('2026-02-15')).toBe('15/02');
    });

    it('returns empty string for null input', () => {
        expect(displayDateShort(null)).toBe('');
        expect(displayDateShort('')).toBe('');
    });
});

describe('getTodayLocal', () => {
    it('returns today in YYYY-MM-DD format', () => {
        const today = getTodayLocal();
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe('getInvoiceMonth', () => {
    // Card with closing day 10: 
    // Purchases before day 10 → closes this month → due NEXT month
    // Purchases on/after day 10 → closes NEXT month → due month after next
    const CLOSING_DAY_10 = 10;

    describe('purchase BEFORE closing day (goes to next month invoice)', () => {
        it('day 5, closing 10 → invoice in March (closes Feb, due Mar)', () => {
            expect(getInvoiceMonth('2026-02-05', CLOSING_DAY_10)).toBe('2026-03-01');
        });

        it('day 1, closing 10 → invoice in March (closes Feb, due Mar)', () => {
            expect(getInvoiceMonth('2026-02-01', CLOSING_DAY_10)).toBe('2026-03-01');
        });

        it('day 9, closing 10 → invoice in March (closes Feb, due Mar)', () => {
            expect(getInvoiceMonth('2026-02-09', CLOSING_DAY_10)).toBe('2026-03-01');
        });
    });

    describe('purchase ON closing day (goes to month after next invoice)', () => {
        it('day 10, closing 10 → invoice in April (missed Feb closing, closes Mar, due Apr)', () => {
            expect(getInvoiceMonth('2026-02-10', CLOSING_DAY_10)).toBe('2026-04-01');
        });
    });

    describe('purchase AFTER closing day (goes to month after next invoice)', () => {
        it('day 15, closing 10 → invoice in April (closes Mar, due Apr)', () => {
            expect(getInvoiceMonth('2026-02-15', CLOSING_DAY_10)).toBe('2026-04-01');
        });

        it('day 28, closing 10 → invoice in April (closes Mar, due Apr)', () => {
            expect(getInvoiceMonth('2026-02-28', CLOSING_DAY_10)).toBe('2026-04-01');
        });
    });

    describe('year boundary', () => {
        it('purchase in December after closing rolls to February next year', () => {
            // Dec 15, closing 10 → missed Dec closing → closes Jan → due Feb
            expect(getInvoiceMonth('2026-12-15', CLOSING_DAY_10)).toBe('2027-02-01');
        });

        it('purchase in December before closing goes to January next year', () => {
            // Dec 5, closing 10 → closes Dec → due Jan
            expect(getInvoiceMonth('2026-12-05', CLOSING_DAY_10)).toBe('2027-01-01');
        });

        it('purchase on Dec 10 (closing=10) rolls to February next year', () => {
            // Dec 10, closing 10 → missed Dec closing → closes Jan → due Feb
            expect(getInvoiceMonth('2026-12-10', CLOSING_DAY_10)).toBe('2027-02-01');
        });
    });

    describe('different closing days', () => {
        it('closing day 1: purchase on day 1 goes to month after next', () => {
            // Feb 1, closing 1 → missed Feb closing → closes Mar → due Apr
            expect(getInvoiceMonth('2026-02-01', 1)).toBe('2026-04-01');
        });

        it('closing day 25: purchase on day 20 goes to next month', () => {
            // Feb 20, closing 25 → before closing → closes Feb → due Mar
            expect(getInvoiceMonth('2026-02-20', 25)).toBe('2026-03-01');
        });

        it('closing day 25: purchase on day 25 goes to month after next', () => {
            // Feb 25, closing 25 → on closing → closes Mar → due Apr
            expect(getInvoiceMonth('2026-02-25', 25)).toBe('2026-04-01');
        });

        it('closing day 31: purchase on day 30 goes to next month', () => {
            // Mar 30, closing 31 → before closing → closes Mar → due Apr
            expect(getInvoiceMonth('2026-03-30', 31)).toBe('2026-04-01');
        });

        it('closing day 31: purchase on day 31 goes to month after next', () => {
            // Mar 31, closing 31 → on closing → closes Apr → due May
            expect(getInvoiceMonth('2026-03-31', 31)).toBe('2026-05-01');
        });

        it('closing day 28: purchase on day 23 (user scenario) goes to next month', () => {
            // Feb 23, closing 28 → before closing → closes Feb → due Mar
            expect(getInvoiceMonth('2026-02-23', 28)).toBe('2026-03-01');
        });

        it('closing day 28: purchase on day 28 goes to month after next', () => {
            // Feb 28, closing 28 → on closing → closes Mar → due Apr
            expect(getInvoiceMonth('2026-02-28', 28)).toBe('2026-04-01');
        });
    });

    describe('invalid inputs', () => {
        it('returns null when transactionDate is null', () => {
            expect(getInvoiceMonth(null, 10)).toBeNull();
        });

        it('returns null when closingDay is null', () => {
            expect(getInvoiceMonth('2026-02-15', null)).toBeNull();
        });

        it('returns null when closingDay is 0', () => {
            expect(getInvoiceMonth('2026-02-15', 0)).toBeNull();
        });

        it('returns null when transactionDate is empty string', () => {
            expect(getInvoiceMonth('', 10)).toBeNull();
        });
    });
});
