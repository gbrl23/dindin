import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useProfiles } from '../hooks/useProfiles';

const TransactionsContext = createContext({});

export const useTransactionsContext = () => useContext(TransactionsContext);

export const TransactionsProvider = ({ children }) => {
    const { user } = useAuth();
    const { profiles } = useProfiles();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetched, setLastFetched] = useState(0);

    const fetchTransactions = useCallback(async (force = false) => {
        // Cache: 5 mins
        const now = Date.now();
        if (!force && transactions.length > 0 && (now - lastFetched < 5 * 60 * 1000)) {
            return;
        }

        if (!user || profiles.length === 0) return;

        try {
            if (transactions.length === 0) setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    payer:profiles!payer_id(id, full_name),
                    card:cards!card_id(id, name),
                    category_details:categories!category_id(id, name, icon, color, type),
                    shares:transaction_shares!transaction_id(
                        transaction_id,
                        profile_id,
                        share_amount,
                        status,
                        profile:profiles!profile_id(id, full_name)
                    )
                `)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            setTransactions(data);
            setLastFetched(Date.now());
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user, profiles, transactions.length, lastFetched]);

    // Initial fetch
    useEffect(() => {
        if (user && profiles.length > 0) {
            fetchTransactions();
        } else if (!user) {
            setTransactions([]);
        }
    }, [user, profiles, fetchTransactions]);

    // --- Actions ---

    const addTransactionsBulk = async (transactionsData) => {
        if (!transactionsData || transactionsData.length === 0) return [];
        try {
            const transactionsPayload = transactionsData.map(t => ({
                description: t.description,
                amount: t.amount,
                date: t.date,
                invoice_date: t.invoice_date || null,
                payer_id: t.payer_id,
                card_id: t.card_id || null,
                category: t.category,
                category_id: t.category_id || null,
                type: t.type || 'expense',
                group_id: t.group_id || null,
                series_id: t.series_id || null,
                is_paid: t.is_paid || false,
                goal_id: t.goal_id || null,
                competence_date: t.competence_date || null,
                import_id: t.import_id || null
            }));

            const { data: createdTransactions, error: transError } = await supabase
                .from('transactions')
                .insert(transactionsPayload)
                .select(); // IDs

            if (transError) throw transError;

            let allShares = [];
            createdTransactions.forEach((newTx, index) => {
                const originalData = transactionsData[index];
                if (originalData.shares && originalData.shares.length > 0) {
                    const sharesForTx = originalData.shares.map(share => ({
                        transaction_id: newTx.id,
                        profile_id: share.profile_id,
                        share_amount: share.share_amount,
                        status: 'pending'
                    }));
                    allShares = [...allShares, ...sharesForTx];
                }
            });

            if (allShares.length > 0) {
                const { error: sharesError } = await supabase
                    .from('transaction_shares')
                    .insert(allShares);
                if (sharesError) throw sharesError;
            }

            // Refresh in background (non-blocking for UX)
            fetchTransactions(true);
            return createdTransactions;
        } catch (err) {
            console.error('Error adding bulk transactions:', err);
            throw err;
        }
    };

    const addTransaction = async (transactionData) => {
        return addTransactionsBulk([transactionData]).then(res => res[0]);
    };

    const updateTransaction = async (id, transactionData) => {
        try {
            const { error: transError } = await supabase
                .from('transactions')
                .update({
                    description: transactionData.description,
                    amount: transactionData.amount,
                    date: transactionData.date,
                    invoice_date: transactionData.invoice_date || null,
                    payer_id: transactionData.payer_id,
                    card_id: transactionData.card_id || null,
                    category: transactionData.category,
                    category_id: transactionData.category_id || null,
                    type: transactionData.type || 'expense',
                    group_id: transactionData.group_id || null,
                    is_paid: transactionData.is_paid !== undefined ? transactionData.is_paid : false,
                    goal_id: transactionData.goal_id || null,
                    competence_date: transactionData.competence_date || null
                })
                .eq('id', id);

            if (transError) throw transError;

            const { error: deleteError } = await supabase
                .from('transaction_shares')
                .delete()
                .eq('transaction_id', id);

            if (deleteError) throw deleteError;

            if (transactionData.shares && transactionData.shares.length > 0) {
                const sharesToInsert = transactionData.shares.map(share => ({
                    transaction_id: id,
                    profile_id: share.profile_id,
                    share_amount: share.share_amount,
                    status: 'pending'
                }));
                const { error: insertError } = await supabase.from('transaction_shares').insert(sharesToInsert);
                if (insertError) throw insertError;
            }

            await fetchTransactions(true);
        } catch (err) {
            console.error('Error updating transaction:', err);
            throw err;
        }
    };

    const removeTransaction = async (id) => {
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;
            setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error('Error deleting transaction:', err);
            throw err;
        }
    };

    const updateTransactionSeries = async (seriesId, currentTransactionId, transactionData, scope = 'all') => {
        try {
            // Scope: Single -> Detach from series (series_id = null)
            if (scope === 'single') {
                // Update ONLY this ID, set series_id to null
                const { error } = await supabase.from('transactions').update({
                    description: transactionData.description,
                    amount: transactionData.amount,
                    payer_id: transactionData.payer_id,
                    card_id: transactionData.card_id || null,
                    category: transactionData.category,
                    category_id: transactionData.category_id || null,
                    type: transactionData.type || 'expense',
                    group_id: transactionData.group_id || null,
                    goal_id: transactionData.goal_id || null,
                    series_id: null, // Detach
                    competence_date: transactionData.competence_date || null
                }).eq('id', currentTransactionId);

                if (error) throw error;

            } else if (scope === 'future') {
                // Scope: Future -> Split Series
                // 1. Generate NEW Series ID
                // 2. Update THIS and FUTURE items to have NEW Series ID + New Data
                const newSeriesId = crypto.randomUUID();

                const { error } = await supabase.from('transactions')
                    .update({
                        description: transactionData.description,
                        amount: transactionData.amount,
                        invoice_date: transactionData.invoice_date || null,
                        payer_id: transactionData.payer_id,
                        card_id: transactionData.card_id || null,
                        category: transactionData.category,
                        category_id: transactionData.category_id || null,
                        type: transactionData.type || 'expense',
                        group_id: transactionData.group_id || null,
                        goal_id: transactionData.goal_id || null,
                        series_id: newSeriesId, // New Series ID
                        competence_date: transactionData.competence_date || null
                    })
                    .eq('series_id', seriesId)
                    .gte('date', transactionData.date); // Greater or Equal to current date

                if (error) throw error;

            } else {
                // Scope: All -> Update everything with same series_id
                const { error } = await supabase.from('transactions').update({
                    description: transactionData.description,
                    amount: transactionData.amount,
                    payer_id: transactionData.payer_id,
                    card_id: transactionData.card_id || null,
                    category: transactionData.category,
                    category_id: transactionData.category_id || null,
                    type: transactionData.type || 'expense',
                    group_id: transactionData.group_id || null,
                    goal_id: transactionData.goal_id || null,
                    competence_date: transactionData.competence_date || null
                }).eq('series_id', seriesId);

                if (error) throw error;
            }

            await fetchTransactions(true);
        } catch (err) {
            console.error('Error updating series:', err);
            throw err;
        }
    };

    const removeTransactionSeries = async (id, seriesId, scope = 'single') => {
        try {
            let query = supabase.from('transactions').delete();

            if (scope === 'all') {
                query = query.eq('series_id', seriesId);
            } else if (scope === 'future') {
                const currentTx = transactions.find(t => t.id === id);
                if (currentTx) {
                    query = query.eq('series_id', seriesId).gte('date', currentTx.date);
                } else {
                    const { data } = await supabase.from('transactions').select('date').eq('id', id).single();
                    if (data) query = query.eq('series_id', seriesId).gte('date', data.date);
                }
            } else {
                query = query.eq('id', id);
            }

            const { error } = await query;
            if (error) throw error;
            await fetchTransactions(true);
        } catch (err) {
            console.error('Error deleting series:', err);
            throw err;
        }
    };

    return (
        <TransactionsContext.Provider value={{
            transactions, loading, error, refreshTransactions: () => fetchTransactions(true),
            addTransaction, addTransactionsBulk, updateTransaction, removeTransaction,
            updateTransactionSeries, removeTransactionSeries, fetchTransactions
        }}>
            {children}
        </TransactionsContext.Provider>
    );
};
