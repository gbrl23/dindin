import Papa from 'papaparse';

/**
 * Build CSV rows from filtered transactions
 * @param {Array} transactions - Filtered transaction list
 * @returns {Array<Object>} Rows ready for PapaParse
 */
export function buildCsvRows(transactions) {
    if (!transactions || transactions.length === 0) return [];

    return transactions.map(tx => ({
        Data: tx.date?.substring(0, 10) || '',
        Descricao: tx.description || '',
        Categoria: tx.category_details?.name || tx.category || 'Sem categoria',
        Tipo: tx.type === 'income' ? 'Receita'
            : tx.type === 'bill' ? 'Conta'
            : tx.type === 'investment' ? 'Investimento'
            : 'Despesa',
        Valor: Number(tx.amount || 0).toFixed(2).replace('.', ','),
        Cartao: tx.card?.name || '',
    }));
}

/**
 * Generate CSV string from transactions
 * @param {Array} transactions - Filtered transaction list
 * @returns {string} CSV string with BOM for Excel compatibility
 */
export function generateCsvString(transactions) {
    const rows = buildCsvRows(transactions);
    if (rows.length === 0) return '';

    const csv = Papa.unparse(rows, {
        delimiter: ';',
        header: true,
    });

    // BOM for UTF-8 with accents in Excel
    return '\uFEFF' + csv;
}

/**
 * Export and download CSV file
 * @param {Array} transactions - Filtered transaction list
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
export function exportCsv(transactions, startDate, endDate) {
    const csvString = generateCsvString(transactions);
    if (!csvString) return;

    const filename = `dindin-relatorio-${startDate}-${endDate}.csv`;
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    // Try Web Share API on mobile
    if (navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: 'text/csv' });
        if (navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: 'Relatório Dindin' }).catch(() => {
                downloadBlob(blob, filename);
            });
            return;
        }
    }

    downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
