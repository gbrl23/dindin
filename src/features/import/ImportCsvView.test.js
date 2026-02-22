import { describe, it, expect } from 'vitest';
import { parseAmount, parseDate, autoDetectMapping, buildMappedRows } from './ImportCsvView';

// ============================================================
// parseAmount
// ============================================================
describe('parseAmount', () => {
    it('parses BR format: 1.234,56', () => {
        expect(parseAmount('1.234,56')).toBe(1234.56);
    });

    it('parses BR format without thousands: 234,56', () => {
        expect(parseAmount('234,56')).toBe(234.56);
    });

    it('parses US format: 1,234.56', () => {
        expect(parseAmount('1,234.56')).toBe(1234.56);
    });

    it('parses simple integer', () => {
        expect(parseAmount('100')).toBe(100);
    });

    it('parses with R$ prefix', () => {
        expect(parseAmount('R$ 1.234,56')).toBe(1234.56);
    });

    it('handles negative with minus', () => {
        expect(parseAmount('-50,00')).toBe(50);
    });

    it('handles negative with parentheses', () => {
        expect(parseAmount('(50,00)')).toBe(50);
    });

    it('returns 0 for empty/null', () => {
        expect(parseAmount('')).toBe(0);
        expect(parseAmount(null)).toBe(0);
        expect(parseAmount(undefined)).toBe(0);
    });

    it('returns 0 for non-numeric', () => {
        expect(parseAmount('abc')).toBe(0);
    });

    it('parses US thousands without decimals: 1,234', () => {
        expect(parseAmount('1,234')).toBe(1234);
    });

    it('parses with spaces', () => {
        expect(parseAmount(' R$  99,90 ')).toBe(99.90);
    });
});

// ============================================================
// parseDate
// ============================================================
describe('parseDate', () => {
    it('parses DD/MM/YYYY', () => {
        expect(parseDate('15/03/2026')).toBe('2026-03-15');
    });

    it('parses D/M/YYYY (single digit)', () => {
        expect(parseDate('5/3/2026')).toBe('2026-03-05');
    });

    it('parses YYYY-MM-DD (ISO)', () => {
        expect(parseDate('2026-03-15')).toBe('2026-03-15');
    });

    it('parses DD-MM-YYYY', () => {
        expect(parseDate('15-03-2026')).toBe('2026-03-15');
    });

    it('parses DD.MM.YYYY', () => {
        expect(parseDate('15.03.2026')).toBe('2026-03-15');
    });

    it('parses 2-digit year (20xx)', () => {
        expect(parseDate('15/03/26')).toBe('2026-03-15');
    });

    it('parses 2-digit year (19xx for >50)', () => {
        expect(parseDate('15/03/95')).toBe('1995-03-15');
    });

    it('returns null for empty/null', () => {
        expect(parseDate('')).toBeNull();
        expect(parseDate(null)).toBeNull();
        expect(parseDate(undefined)).toBeNull();
    });

    it('returns null for invalid date', () => {
        expect(parseDate('not-a-date')).toBeNull();
    });

    it('returns null for invalid month', () => {
        expect(parseDate('15/13/2026')).toBeNull();
    });

    it('handles whitespace', () => {
        expect(parseDate('  15/03/2026  ')).toBe('2026-03-15');
    });
});

// ============================================================
// autoDetectMapping
// ============================================================
describe('autoDetectMapping', () => {
    it('detects common PT-BR headers', () => {
        const mapping = autoDetectMapping(['Data', 'Descrição', 'Valor', 'Categoria']);
        expect(mapping['Data']).toBe('date');
        expect(mapping['Descrição']).toBe('description');
        expect(mapping['Valor']).toBe('amount');
        expect(mapping['Categoria']).toBe('category');
    });

    it('detects common EN headers', () => {
        const mapping = autoDetectMapping(['Date', 'Description', 'Amount', 'Category']);
        expect(mapping['Date']).toBe('date');
        expect(mapping['Description']).toBe('description');
        expect(mapping['Amount']).toBe('amount');
        expect(mapping['Category']).toBe('category');
    });

    it('maps unknown headers to ignore', () => {
        const mapping = autoDetectMapping(['ID', 'Random', 'Valor']);
        expect(mapping['ID']).toBe('ignore');
        expect(mapping['Random']).toBe('ignore');
        expect(mapping['Valor']).toBe('amount');
    });

    it('detects historico as description', () => {
        const mapping = autoDetectMapping(['Historico']);
        expect(mapping['Historico']).toBe('description');
    });

    it('detects tipo as type', () => {
        const mapping = autoDetectMapping(['Tipo']);
        expect(mapping['Tipo']).toBe('type');
    });
});

// ============================================================
// buildMappedRows
// ============================================================
describe('buildMappedRows', () => {
    const headers = ['Data', 'Desc', 'Valor'];
    const mapping = { 'Data': 'date', 'Desc': 'description', 'Valor': 'amount' };

    it('maps valid rows correctly', () => {
        const rows = [
            { 'Data': '15/03/2026', 'Desc': 'Mercado', 'Valor': '150,00' },
        ];
        const result = buildMappedRows(rows, mapping, headers);
        expect(result).toHaveLength(1);
        expect(result[0].valid).toBe(true);
        expect(result[0].date).toBe('2026-03-15');
        expect(result[0].description).toBe('Mercado');
        expect(result[0].amount).toBe(150);
        expect(result[0].type).toBe('expense');
    });

    it('marks rows with missing description as invalid', () => {
        const rows = [
            { 'Data': '15/03/2026', 'Desc': '', 'Valor': '100,00' },
        ];
        const result = buildMappedRows(rows, mapping, headers);
        expect(result[0].valid).toBe(false);
        expect(result[0].error).toContain('descrição');
    });

    it('marks rows with zero amount as invalid', () => {
        const rows = [
            { 'Data': '15/03/2026', 'Desc': 'Teste', 'Valor': '0' },
        ];
        const result = buildMappedRows(rows, mapping, headers);
        expect(result[0].valid).toBe(false);
        expect(result[0].error).toContain('Valor');
    });

    it('marks rows with invalid date as invalid', () => {
        const rows = [
            { 'Data': 'invalid', 'Desc': 'Teste', 'Valor': '100,00' },
        ];
        const result = buildMappedRows(rows, mapping, headers);
        expect(result[0].valid).toBe(false);
    });

    it('handles type column mapping', () => {
        const h = ['Data', 'Desc', 'Valor', 'Tipo'];
        const m = { 'Data': 'date', 'Desc': 'description', 'Valor': 'amount', 'Tipo': 'type' };
        const rows = [
            { 'Data': '15/03/2026', 'Desc': 'Salário', 'Valor': '5000', 'Tipo': 'Receita' },
        ];
        const result = buildMappedRows(rows, m, h);
        expect(result[0].type).toBe('income');
    });

    it('matches category from categories list', () => {
        const h = ['Data', 'Desc', 'Valor', 'Cat'];
        const m = { 'Data': 'date', 'Desc': 'description', 'Valor': 'amount', 'Cat': 'category' };
        const cats = [{ id: 'cat1', name: 'Comida' }];
        const rows = [
            { 'Data': '15/03/2026', 'Desc': 'Almoço', 'Valor': '30', 'Cat': 'comida' },
        ];
        const result = buildMappedRows(rows, m, h, cats);
        expect(result[0].category_id).toBe('cat1');
        expect(result[0].category_name).toBe('Comida');
    });

    it('keeps unmatched category as name only', () => {
        const h = ['Data', 'Desc', 'Valor', 'Cat'];
        const m = { 'Data': 'date', 'Desc': 'description', 'Valor': 'amount', 'Cat': 'category' };
        const rows = [
            { 'Data': '15/03/2026', 'Desc': 'Almoço', 'Valor': '30', 'Cat': 'Lazer' },
        ];
        const result = buildMappedRows(rows, m, h, []);
        expect(result[0].category_id).toBeNull();
        expect(result[0].category_name).toBe('Lazer');
    });

    it('processes multiple rows', () => {
        const rows = [
            { 'Data': '01/03/2026', 'Desc': 'Item 1', 'Valor': '10' },
            { 'Data': '02/03/2026', 'Desc': 'Item 2', 'Valor': '20' },
            { 'Data': 'bad', 'Desc': 'Item 3', 'Valor': '30' },
        ];
        const result = buildMappedRows(rows, mapping, headers);
        expect(result).toHaveLength(3);
        expect(result.filter(r => r.valid)).toHaveLength(2);
        expect(result.filter(r => !r.valid)).toHaveLength(1);
    });
});
