import { useTransactionsContext } from '../contexts/TransactionsContext';

export function useTransactions() {
    return useTransactionsContext();
}
