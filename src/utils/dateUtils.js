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
 * Calculates the invoice PAYMENT month for a Brazilian credit card transaction.
 *
 * The "invoice month" = the month the user PAYS the bill.
 *
 * Step 1: Determine which billing cycle the purchase falls into.
 *   - day <  closingDay → cycle closes on closingDay of the SAME month
 *   - day >= closingDay → cycle closes on closingDay of the NEXT month
 *
 * Step 2: Determine the PAYMENT month based on the due day.
 *   - If dueDay >= closingDay → payment is in the SAME month the cycle closes
 *   - If dueDay <  closingDay → payment is in the MONTH AFTER the cycle closes
 *
 * Examples:
 *
 * Gabriel (Itaú): closes 10, due 17  (17 >= 10 → no extra offset)
 *   Feb 05 (day <  10) → cycle closes Feb 10 → pays Feb 17 → "February"
 *   Feb 15 (day >= 10) → cycle closes Mar 10 → pays Mar 17 → "March"
 *
 * Ana (Itaú Latam): closes 28, due 5  (5 < 28 → +1 month offset)
 *   Feb 23 (day <  28) → cycle closes Feb 28 → pays Mar 5 → "March"
 *   Jan 30 (day >= 28) → cycle closes Feb 28 → pays Mar 5 → "March"
 *   Jan 15 (day <  28) → cycle closes Jan 28 → pays Feb 5 → "February"
 *
 * @param {string} dateStr - Transaction date in YYYY-MM-DD format
 * @param {number} closingDay - Card's closing day (1-31)
 * @param {number} [dueDay] - Card's due day (1-31). If omitted, assumes same-month payment.
 * @returns {string|null} Invoice payment month in YYYY-MM format, or null if invalid
 */
export const getInvoiceMonth = (dateStr, closingDay, dueDay) => {
    if (!dateStr || !closingDay) return null;

    const date = parseLocalDate(dateStr);
    const day = date.getDate();
    const month = date.getMonth(); // 0-indexed
    const year = date.getFullYear();

    // Step 1: Which cycle does this purchase belong to?
    let cycleCloseMonth = (day < closingDay) ? month : month + 1;

    // Step 2: Payment offset — if due day is before closing day, payment is next month
    const paymentOffset = (dueDay && dueDay < closingDay) ? 1 : 0;

    const invoiceMonth = new Date(year, cycleCloseMonth + paymentOffset, 1);

    return format(invoiceMonth, 'yyyy-MM');
};
