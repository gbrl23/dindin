// Date utilities for timezone-safe date handling

/**
 * Format a Date object to YYYY-MM-DD string using LOCAL timezone
 * This avoids the timezone shift issue caused by toISOString() which uses UTC
 * @param {Date} d - Date object to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatLocalDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayLocal = () => formatLocalDate(new Date());

/**
 * Parse a YYYY-MM-DD string into a Date object in LOCAL timezone
 * This avoids the timezone shift issue when parsing date strings
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Date object set to noon local time
 */
export const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    // Set to noon to avoid any DST edge cases
    return new Date(year, month - 1, day, 12, 0, 0);
};

/**
 * Display a date string (YYYY-MM-DD) in pt-BR format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const displayDate = (dateStr, options = {}) => {
    if (!dateStr) return '';
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('pt-BR', options);
};

/**
 * Display a date string as DD/MM format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Date in DD/MM format
 */
export const displayDateShort = (dateStr) => {
    if (!dateStr) return '';
    const [, month, day] = dateStr.split('-');
    return `${day}/${month}`;
};

/**
 * Calculate the invoice month for a card transaction based on closing day.
 * If the purchase day >= closing_day, the transaction falls into the NEXT month's invoice.
 *
 * @param {string} transactionDate - Transaction date in YYYY-MM-DD format
 * @param {number} closingDay - Card closing day (1-31)
 * @returns {string|null} Invoice date as YYYY-MM-01 or null if inputs are invalid
 */
export const getInvoiceMonth = (transactionDate, closingDay) => {
    if (!transactionDate || !closingDay) return null;

    const [txYear, txMonth, txDay] = transactionDate.split('-').map(Number);
    if (!txYear || !txMonth || !txDay) return null;

    let invMonth = txMonth;
    let invYear = txYear;

    if (txDay >= closingDay) {
        invMonth++;
        if (invMonth > 12) {
            invMonth = 1;
            invYear++;
        }
    }

    const pad = (n) => String(n).padStart(2, '0');
    return `${invYear}-${pad(invMonth)}-01`;
};
