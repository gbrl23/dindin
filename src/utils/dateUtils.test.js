import { describe, it, expect } from 'vitest';
import { getInvoiceMonth, getTodayLocal, formatLocalDate, parseLocalDate, displayDate, displayDateShort } from './dateUtils';

describe('dateUtils', () => {
    describe('formatLocalDate', () => {
        it('formata Date para YYYY-MM-DD', () => {
            const d = new Date(2026, 1, 15);
            expect(formatLocalDate(d)).toBe('2026-02-15');
        });
    });

    describe('parseLocalDate', () => {
        it('retorna Date correto a partir de string', () => {
            const d = parseLocalDate('2026-03-10');
            expect(d.getFullYear()).toBe(2026);
            expect(d.getMonth()).toBe(2);
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

        // ====== GABRIEL - Itaú (fecha 10, vence 17) ======
        // vence 17 >= fecha 10 → pagamento no MESMO mês que fecha → offset 0
        describe('Itaú Gabriel (fecha 10, vence 17)', () => {
            const C = 10, D = 17;

            it('Compra 05/Fev (antes do fechamento) → Fevereiro', () => {
                expect(getInvoiceMonth('2026-02-05', C, D)).toBe('2026-02');
            });

            it('Compra 10/Fev (NO dia do fechamento) → Março', () => {
                expect(getInvoiceMonth('2026-02-10', C, D)).toBe('2026-03');
            });

            it('Compra 11/Fev → Março', () => {
                expect(getInvoiceMonth('2026-02-11', C, D)).toBe('2026-03');
            });

            it('Compra 15/Fev → Março', () => {
                expect(getInvoiceMonth('2026-02-15', C, D)).toBe('2026-03');
            });

            it('Compra 21/Fev → Março', () => {
                expect(getInvoiceMonth('2026-02-21', C, D)).toBe('2026-03');
            });

            it('Virada de ano: 25/Dez → Janeiro 2027', () => {
                expect(getInvoiceMonth('2026-12-25', C, D)).toBe('2027-01');
            });

            it('05/Dez (antes do fechamento) → Dezembro', () => {
                expect(getInvoiceMonth('2026-12-05', C, D)).toBe('2026-12');
            });
        });

        // ====== ANA - Itaú Latam (fecha 28, vence 5) ======
        // vence 5 < fecha 28 → pagamento no MÊS SEGUINTE ao fecha → offset +1
        describe('Itaú Latam Ana (fecha 28, vence 5)', () => {
            const C = 28, D = 5;

            it('Compra 15/Jan (antes do fechamento) → Fevereiro (paga Feb 5)', () => {
                expect(getInvoiceMonth('2026-01-15', C, D)).toBe('2026-02');
            });

            it('Compra 20/Jan (antes do fechamento) → Fevereiro', () => {
                expect(getInvoiceMonth('2026-01-20', C, D)).toBe('2026-02');
            });

            it('Compra 23/Fev (antes do fechamento) → Março (paga Mar 5)', () => {
                expect(getInvoiceMonth('2026-02-23', C, D)).toBe('2026-03');
            });

            it('Compra 28/Fev (NO dia do fechamento) → Abril', () => {
                expect(getInvoiceMonth('2026-02-28', C, D)).toBe('2026-04');
            });

            it('Compra 29/Jan (depois do fechamento) → Março', () => {
                expect(getInvoiceMonth('2026-01-29', C, D)).toBe('2026-03');
            });

            it('Compra 30/Jan (depois do fechamento) → Março', () => {
                expect(getInvoiceMonth('2026-01-30', C, D)).toBe('2026-03');
            });

            it('Compra 31/Jan (depois do fechamento) → Março', () => {
                expect(getInvoiceMonth('2026-01-31', C, D)).toBe('2026-03');
            });

            it('Virada de ano: 30/Dez → Fevereiro 2027', () => {
                expect(getInvoiceMonth('2026-12-30', C, D)).toBe('2027-02');
            });

            it('Virada de ano: 20/Dez → Janeiro 2027', () => {
                expect(getInvoiceMonth('2026-12-20', C, D)).toBe('2027-01');
            });
        });

        // ====== GABRIEL - Nubank (fecha 2, vence 9) ======
        // vence 9 >= fecha 2 → pagamento no MESMO mês que fecha → offset 0
        describe('Nubank Gabriel (fecha 2, vence 9)', () => {
            const C = 2, D = 9;

            it('Compra 01/Mar → Março', () => {
                expect(getInvoiceMonth('2026-03-01', C, D)).toBe('2026-03');
            });

            it('Compra 02/Mar (NO fechamento) → Abril', () => {
                expect(getInvoiceMonth('2026-03-02', C, D)).toBe('2026-04');
            });

            it('Compra 03/Mar → Abril', () => {
                expect(getInvoiceMonth('2026-03-03', C, D)).toBe('2026-04');
            });

            it('Compra 15/Mar → Abril', () => {
                expect(getInvoiceMonth('2026-03-15', C, D)).toBe('2026-04');
            });
        });

        // ====== SEM dueDay (backward compatibility) ======
        describe('Sem dueDay (compatibilidade)', () => {
            it('Funciona sem dueDay (offset 0)', () => {
                expect(getInvoiceMonth('2026-02-05', 10)).toBe('2026-02');
                expect(getInvoiceMonth('2026-02-15', 10)).toBe('2026-03');
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
