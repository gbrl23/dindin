import { describe, it, expect } from 'vitest';
import { getInvoiceMonth, getTodayLocal, formatLocalDate, parseLocalDate, displayDate, displayDateShort } from './dateUtils';

describe('dateUtils', () => {
    describe('formatLocalDate', () => {
        it('formata Date para YYYY-MM-DD', () => {
            const d = new Date(2026, 1, 15); // Feb 15, 2026
            expect(formatLocalDate(d)).toBe('2026-02-15');
        });
    });

    describe('parseLocalDate', () => {
        it('retorna Date correto a partir de string', () => {
            const d = parseLocalDate('2026-03-10');
            expect(d.getFullYear()).toBe(2026);
            expect(d.getMonth()).toBe(2); // 0-indexed
            expect(d.getDate()).toBe(10);
        });

        it('retorna new Date() se string vazia', () => {
            const d = parseLocalDate('');
            expect(d).toBeInstanceOf(Date);
        });
    });

    describe('displayDate', () => {
        it('formata data em pt-BR', () => {
            const result = displayDate('2026-03-15');
            expect(result).toContain('2026');
        });

        it('retorna string vazia se input vazio', () => {
            expect(displayDate('')).toBe('');
        });
    });

    describe('displayDateShort', () => {
        it('formata data curta DD/MM', () => {
            const result = displayDateShort('2026-03-15');
            expect(result).toBe('15/03');
        });

        it('retorna string vazia se input vazio', () => {
            expect(displayDateShort('')).toBe('');
        });
    });

    describe('getTodayLocal', () => {
        it('retorna data no formato YYYY-MM-DD', () => {
            const today = getTodayLocal();
            expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('getInvoiceMonth', () => {
        // ====== CARTÃO COM FECHAMENTO DIA 10 (Gabriel - Itaú) ======
        describe('Fechamento dia 10 (ex: Itaú Gabriel)', () => {
            const C = 10;

            it('Compra dia 05/Fev (antes do fechamento) → Fevereiro', () => {
                expect(getInvoiceMonth('2026-02-05', C)).toBe('2026-02');
            });

            it('Compra dia 10/Fev (NO dia do fechamento) → Março', () => {
                expect(getInvoiceMonth('2026-02-10', C)).toBe('2026-03');
            });

            it('Compra dia 11/Fev (um dia DEPOIS do fechamento) → Março', () => {
                expect(getInvoiceMonth('2026-02-11', C)).toBe('2026-03');
            });

            it('Compra dia 15/Fev (depois do fechamento) → Março', () => {
                expect(getInvoiceMonth('2026-02-15', C)).toBe('2026-03');
            });

            it('Compra dia 21/Fev (depois do fechamento) → Março', () => {
                expect(getInvoiceMonth('2026-02-21', C)).toBe('2026-03');
            });

            it('Compra dia 28/Fev (depois do fechamento) → Março', () => {
                expect(getInvoiceMonth('2026-02-28', C)).toBe('2026-03');
            });

            it('Virada de ano: Compra 25/Dez → Janeiro do ano seguinte', () => {
                expect(getInvoiceMonth('2026-12-25', C)).toBe('2027-01');
            });

            it('Virada de ano: Compra 05/Dez → Dezembro mesmo', () => {
                expect(getInvoiceMonth('2026-12-05', C)).toBe('2026-12');
            });
        });

        // ====== CARTÃO COM FECHAMENTO DIA 28 (Ana - Itaú Latam) ======
        describe('Fechamento dia 28 (ex: Itaú Latam Ana)', () => {
            const C = 28;

            it('Compra dia 15/Jan (antes do fechamento) → Janeiro', () => {
                expect(getInvoiceMonth('2026-01-15', C)).toBe('2026-01');
            });

            it('Compra dia 20/Jan (antes do fechamento) → Janeiro', () => {
                expect(getInvoiceMonth('2026-01-20', C)).toBe('2026-01');
            });

            it('Compra dia 23/Fev (antes do fechamento) → Fevereiro', () => {
                expect(getInvoiceMonth('2026-02-23', C)).toBe('2026-02');
            });

            it('Compra dia 28/Fev (NO dia do fechamento) → Março', () => {
                expect(getInvoiceMonth('2026-02-28', C)).toBe('2026-03');
            });

            it('Compra dia 29/Jan (depois do fechamento) → Fevereiro', () => {
                expect(getInvoiceMonth('2026-01-29', C)).toBe('2026-02');
            });

            it('Compra dia 30/Jan (depois do fechamento) → Fevereiro', () => {
                expect(getInvoiceMonth('2026-01-30', C)).toBe('2026-02');
            });

            it('Compra dia 31/Jan (depois do fechamento) → Fevereiro', () => {
                expect(getInvoiceMonth('2026-01-31', C)).toBe('2026-02');
            });

            it('Virada de ano: Compra 30/Dez → Janeiro do ano seguinte', () => {
                expect(getInvoiceMonth('2026-12-30', C)).toBe('2027-01');
            });
        });

        // ====== CARTÃO COM FECHAMENTO DIA 2 (Gabriel - Nubank/XP) ======
        describe('Fechamento dia 2 (ex: Nubank/XP Gabriel)', () => {
            const C = 2;

            it('Compra dia 01/Mar (antes do fechamento) → Março', () => {
                expect(getInvoiceMonth('2026-03-01', C)).toBe('2026-03');
            });

            it('Compra dia 02/Mar (NO dia do fechamento) → Abril', () => {
                expect(getInvoiceMonth('2026-03-02', C)).toBe('2026-04');
            });

            it('Compra dia 03/Mar (depois do fechamento) → Abril', () => {
                expect(getInvoiceMonth('2026-03-03', C)).toBe('2026-04');
            });

            it('Compra dia 15/Mar (depois do fechamento) → Abril', () => {
                expect(getInvoiceMonth('2026-03-15', C)).toBe('2026-04');
            });

            it('Compra dia 28/Mar (depois do fechamento) → Abril', () => {
                expect(getInvoiceMonth('2026-03-28', C)).toBe('2026-04');
            });
        });

        // ====== EDGE CASES ======
        describe('Edge cases', () => {
            it('retorna null se dateStr é null', () => {
                expect(getInvoiceMonth(null, 10)).toBeNull();
            });

            it('retorna null se closingDay é null', () => {
                expect(getInvoiceMonth('2026-02-15', null)).toBeNull();
            });

            it('retorna null se closingDay é 0', () => {
                expect(getInvoiceMonth('2026-02-15', 0)).toBeNull();
            });
        });
    });
});
