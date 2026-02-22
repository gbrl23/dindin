import { describe, it, expect } from 'vitest';
import { buildCsvRows, generateCsvString } from './exportCsv';

const makeTx = (overrides = {}) => ({
    id: 'tx-1',
    type: 'expense',
    amount: 150.50,
    date: '2026-02-15',
    description: 'Almoço restaurante',
    category: 'Alimentacao',
    category_id: 'cat-food',
    category_details: { name: 'Alimentacao', icon: '🍔', color: '#f97316' },
    card: { name: 'Nubank' },
    ...overrides,
});

describe('buildCsvRows', () => {
    it('returns empty for null', () => {
        expect(buildCsvRows(null)).toEqual([]);
    });

    it('returns empty for empty array', () => {
        expect(buildCsvRows([])).toEqual([]);
    });

    it('maps transaction fields correctly', () => {
        const rows = buildCsvRows([makeTx()]);
        expect(rows).toHaveLength(1);
        expect(rows[0].Data).toBe('2026-02-15');
        expect(rows[0].Descricao).toBe('Almoço restaurante');
        expect(rows[0].Categoria).toBe('Alimentacao');
        expect(rows[0].Tipo).toBe('Despesa');
        expect(rows[0].Valor).toBe('150,50');
        expect(rows[0].Cartao).toBe('Nubank');
    });

    it('maps income type correctly', () => {
        const rows = buildCsvRows([makeTx({ type: 'income' })]);
        expect(rows[0].Tipo).toBe('Receita');
    });

    it('maps bill type correctly', () => {
        const rows = buildCsvRows([makeTx({ type: 'bill' })]);
        expect(rows[0].Tipo).toBe('Conta');
    });

    it('maps investment type correctly', () => {
        const rows = buildCsvRows([makeTx({ type: 'investment' })]);
        expect(rows[0].Tipo).toBe('Investimento');
    });

    it('formats amount with comma separator', () => {
        const rows = buildCsvRows([makeTx({ amount: 1234.56 })]);
        expect(rows[0].Valor).toBe('1234,56');
    });

    it('handles zero amount', () => {
        const rows = buildCsvRows([makeTx({ amount: 0 })]);
        expect(rows[0].Valor).toBe('0,00');
    });

    it('handles missing card', () => {
        const rows = buildCsvRows([makeTx({ card: null })]);
        expect(rows[0].Cartao).toBe('');
    });

    it('uses fallback for missing category_details', () => {
        const rows = buildCsvRows([makeTx({ category_details: null, category: 'Transporte' })]);
        expect(rows[0].Categoria).toBe('Transporte');
    });
});

describe('generateCsvString', () => {
    it('returns empty for empty array', () => {
        expect(generateCsvString([])).toBe('');
    });

    it('starts with BOM', () => {
        const csv = generateCsvString([makeTx()]);
        expect(csv.startsWith('\uFEFF')).toBe(true);
    });

    it('uses semicolon delimiter', () => {
        const csv = generateCsvString([makeTx()]);
        // Header should contain semicolons
        const firstLine = csv.split('\n')[0];
        expect(firstLine).toContain(';');
    });

    it('includes header row', () => {
        const csv = generateCsvString([makeTx()]);
        expect(csv).toContain('Data');
        expect(csv).toContain('Descricao');
        expect(csv).toContain('Categoria');
        expect(csv).toContain('Tipo');
        expect(csv).toContain('Valor');
    });

    it('includes data rows', () => {
        const csv = generateCsvString([makeTx({ description: 'Test item' })]);
        expect(csv).toContain('Test item');
    });

    it('handles multiple transactions', () => {
        const csv = generateCsvString([
            makeTx({ id: '1', description: 'Item A' }),
            makeTx({ id: '2', description: 'Item B' }),
        ]);
        expect(csv).toContain('Item A');
        expect(csv).toContain('Item B');
    });
});
