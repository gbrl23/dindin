/**
 * Build PDF data rows from transactions grouped by category
 * @param {Array} categoryBreakdown - Category breakdown from useReports
 * @returns {Array<Array<string>>} Table rows for autoTable
 */
export function buildPdfRows(categoryBreakdown) {
    if (!categoryBreakdown || categoryBreakdown.length === 0) return [];

    const rows = [];
    categoryBreakdown.forEach(cat => {
        // Category header row
        rows.push([
            { content: `${cat.icon} ${cat.name}`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        ]);
        // Transaction rows
        cat.transactions.forEach(tx => {
            rows.push([
                tx.date?.substring(0, 10) || '',
                tx.description || '',
                tx.type === 'income' ? 'Receita' : tx.type === 'bill' ? 'Conta' : 'Despesa',
                formatBrl(tx.amount),
            ]);
        });
        // Subtotal row
        rows.push([
            { content: `Subtotal: ${formatBrl(cat.total)}`, colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' } },
        ]);
    });

    return rows;
}

function formatBrl(value) {
    return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Export filtered report as PDF (lazy loads jsPDF)
 * @param {Object} params
 * @param {Object} params.summary - { totalIncome, totalExpenses, balance }
 * @param {Array} params.categoryBreakdown - from useReports
 * @param {string} params.startDate - YYYY-MM-DD
 * @param {string} params.endDate - YYYY-MM-DD
 */
export async function exportPdf({ summary, categoryBreakdown, startDate, endDate }) {
    // Lazy import to avoid bundle bloat
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Dindin - Relatorio Financeiro', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const periodStr = `Periodo: ${formatDateBr(startDate)} a ${formatDateBr(endDate)}`;
    doc.text(periodStr, 14, 30);

    // Summary
    const summaryY = 40;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');

    // Receitas
    doc.setTextColor(34, 197, 94);
    doc.text(`Receitas: ${formatBrl(summary.totalIncome)}`, 14, summaryY);

    // Despesas
    doc.setTextColor(239, 68, 68);
    doc.text(`Despesas: ${formatBrl(summary.totalExpenses)}`, 14, summaryY + 7);

    // Balanco
    const balColor = summary.balance >= 0 ? [34, 197, 94] : [239, 68, 68];
    doc.setTextColor(...balColor);
    doc.text(`Balanco: ${formatBrl(summary.balance)}`, 14, summaryY + 14);

    doc.setTextColor(0);

    // Separator line
    doc.setDrawColor(200);
    doc.line(14, summaryY + 20, pageWidth - 14, summaryY + 20);

    // Category breakdown table
    if (categoryBreakdown && categoryBreakdown.length > 0) {
        const tableRows = [];

        categoryBreakdown.forEach(cat => {
            // Category header
            tableRows.push([{
                content: `${cat.icon} ${cat.name} (${cat.percentage}%)`,
                colSpan: 4,
                styles: { fontStyle: 'bold', fillColor: [245, 245, 245], fontSize: 10 },
            }]);

            // Transactions
            cat.transactions.forEach(tx => {
                tableRows.push([
                    tx.date?.substring(0, 10) || '',
                    tx.description || '',
                    tx.type === 'income' ? 'Receita' : tx.type === 'bill' ? 'Conta' : 'Despesa',
                    formatBrl(tx.amount),
                ]);
            });

            // Subtotal
            tableRows.push([{
                content: `Subtotal: ${formatBrl(cat.total)}`,
                colSpan: 4,
                styles: { fontStyle: 'bold', halign: 'right', fontSize: 9 },
            }]);
        });

        autoTable(doc, {
            startY: summaryY + 26,
            head: [['Data', 'Descricao', 'Tipo', 'Valor']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [81, 0, 255], textColor: 255, fontSize: 9 },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 25 },
                3: { halign: 'right', cellWidth: 30 },
            },
            margin: { left: 14, right: 14 },
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Dindin App`,
            14,
            doc.internal.pageSize.getHeight() - 10
        );
        doc.text(
            `Pagina ${i} de ${pageCount}`,
            pageWidth - 14,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'right' }
        );
    }

    // Save
    const filename = `dindin-relatorio-${startDate}-${endDate}.pdf`;
    doc.save(filename);
}

function formatDateBr(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
