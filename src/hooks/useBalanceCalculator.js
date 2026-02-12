import { useMemo } from 'react';
import { parseLocalDate } from '../utils/dateUtils';

/**
 * Hook para calcular balanços de divisões de gastos
 * 
 * @param {Array} transactions - Lista de transações com shares
 * @param {string} myProfileId - ID do perfil do usuário logado
 * @param {Date} selectedDate - Data para filtrar pelo mês
 * @returns {Object} { myExpenses, totalAReceber, totalAPagar, netBalance }
 */
export function useBalanceCalculator(transactions, myProfileId, selectedDate) {
    return useMemo(() => {
        if (!transactions || !myProfileId || !selectedDate) {
            return { myExpenses: 0, totalAReceber: 0, totalAPagar: 0, netBalance: 0 };
        }

        const selectedMonth = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();



        // Helper para verificar se transação é do mês selecionado
        const isInSelectedMonth = (tx) => {
            // Priority:
            // 1. Invoice Date (if expense + card)
            // 2. Competence Date (if exists)
            // 3. Transaction Date (fallback)

            let dateToUse = tx.date;

            if (tx.type === 'expense' && tx.card_id && tx.invoice_date) {
                dateToUse = tx.invoice_date;
            } else if (tx.competence_date) {
                dateToUse = tx.competence_date;
            }

            if (!dateToUse) return false;

            // Safe parse
            const d = parseLocalDate(dateToUse);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        };

        let myExpenses = 0;
        let totalAReceber = 0;
        let totalAPagar = 0;

        for (const tx of transactions) {
            // Considerar despesas e contas do mês selecionado
            if (tx.type !== 'expense' && tx.type !== 'bill' && tx.type !== 'investment') continue;
            if (!isInSelectedMonth(tx)) continue;

            const isMyPayment = tx.payer_id === myProfileId;
            const hasShares = tx.shares && tx.shares.length > 0;

            if (hasShares) {
                // Transação com divisão
                // Encontrar minha share
                const myShare = tx.shares.find(s => s.profile_id === myProfileId);
                const myShareAmount = myShare ? Number(myShare.share_amount) || 0 : 0;

                // Minha despesa = minha parte na divisão
                myExpenses += myShareAmount;

                // Calcular A Receber / A Pagar
                for (const share of tx.shares) {
                    const shareAmount = Number(share.share_amount) || 0;

                    if (isMyPayment && share.profile_id !== myProfileId) {
                        // Eu paguei e essa share é de OUTRA pessoa → Tenho a receber
                        totalAReceber += shareAmount;
                    } else if (!isMyPayment && share.profile_id === myProfileId) {
                        // Outro pagou e essa share é MINHA → Tenho a pagar
                        totalAPagar += shareAmount;
                    }
                }
            } else {
                // Transação sem divisão - só conta se eu sou o payer
                if (isMyPayment) {
                    myExpenses += Number(tx.amount) || 0;
                }
            }
        }

        // Arredondar para 2 casas decimais (dinheiro)
        const round = (v) => Math.round(v * 100) / 100;

        return {
            myExpenses: round(myExpenses),
            totalAReceber: round(totalAReceber),
            totalAPagar: round(totalAPagar),
            netBalance: round(totalAReceber - totalAPagar)
        };
    }, [transactions, myProfileId, selectedDate]);
}

export default useBalanceCalculator;
