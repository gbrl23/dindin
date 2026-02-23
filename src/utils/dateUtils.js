import { format } from 'date-fns';

/**
 * Returns today's date as YYYY-MM-DD string using local timezone.
 */
export const getTodayLocal = () => formatLocalDate(new Date());

/**
 * Formats a Date object to YYYY-MM-DD string using local timezone.
 */
export const formatLocalDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD string into a local Date object (not UTC).
 */
export const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * Displays a date string in pt-BR format.
 */
export const displayDate = (dateStr, options = { day: '2-digit', month: 'long', year: 'numeric' }) => {
    if (!dateStr) return '';
    try {
        const date = parseLocalDate(dateStr);
        return date.toLocaleDateString('pt-BR', options);
    } catch (e) {
        return dateStr;
    }
};

/**
 * Displays a date in short format (DD/MM).
 */
export const displayDateShort = (dateStr) => {
    if (!dateStr) return '';
    try {
        const date = parseLocalDate(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch (e) {
        return dateStr;
    }
};

/**
 * Calculates the invoice month for a Brazilian credit card transaction.
 *
 * Brazilian credit card billing cycle model:
 * - A card with closing day C has billing cycles:
 *   - "Month M invoice" covers: day C+1 of month M-1  →  day C of month M
 *   - Example (closing day 10):
 *     - "March invoice" cycle: Feb 11 → Mar 10
 *     - "February invoice" cycle: Jan 11 → Feb 10
 *
 * Formula:
 *   - If purchase day <= closing day → invoice month = current month
 *   - If purchase day >  closing day → invoice month = next month
 *
 * Examples (closing day 10):
 *   - Purchase Feb 05 (day 5  <= 10) → February
 *   - Purchase Feb 10 (day 10 <= 10) → February
 *   - Purchase Feb 15 (day 15 >  10) → March
 *   - Purchase Feb 21 (day 21 >  10) → March
 *
 * Examples (closing day 28):
 *   - Purchase Feb 23 (day 23 <= 28) → February
 *   - Purchase Jan 30 (day 30 >  28) → February (Jan+1)
 *
 * @param {string} dateStr - Transaction date in YYYY-MM-DD format
 * @param {number} closingDay - Card's closing day (1-31)
 * @returns {string} Invoice month in YYYY-MM format, or null if invalid
 */
export const getInvoiceMonth = (dateStr, closingDay) => {
    if (!dateStr || !closingDay) return null;

    const date = parseLocalDate(dateStr);
    const day = date.getDate();
    const month = date.getMonth(); // 0-indexed
    const year = date.getFullYear();

    let invoiceMonth;

    if (day <= closingDay) {
        // Purchase is within the current billing cycle → same month
        invoiceMonth = new Date(year, month, 1);
    } else {
        // Purchase is after closing → falls into next month's cycle
        invoiceMonth = new Date(year, month + 1, 1);
    }

    return format(invoiceMonth, 'yyyy-MM');
};
