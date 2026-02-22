import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for managing import history (import_logs table)
 */
export function useImportLogs() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('import_logs')
                .select('*, card:cards(name)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Error fetching import logs:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const createLog = useCallback(async (type, filename, transactionCount, totalAmount, cardId = null) => {
        if (!user) return null;
        try {
            const { data, error } = await supabase
                .from('import_logs')
                .insert([{
                    user_id: user.id,
                    type,
                    filename,
                    transaction_count: transactionCount,
                    total_amount: totalAmount,
                    card_id: cardId,
                }])
                .select('*')
                .single();

            if (error) throw error;
            setLogs(prev => [data, ...prev]);
            return data;
        } catch (err) {
            console.error('Error creating import log:', err);
            return null;
        }
    }, [user]);

    const undoImport = useCallback(async (logId) => {
        if (!user) return false;
        try {
            // Delete all transactions with this import_id
            const { error: deleteError } = await supabase
                .from('transactions')
                .delete()
                .eq('import_id', logId);

            if (deleteError) throw deleteError;

            // Mark log as undone
            const { error: updateError } = await supabase
                .from('import_logs')
                .update({ status: 'undone' })
                .eq('id', logId);

            if (updateError) throw updateError;

            setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'undone' } : l));
            return true;
        } catch (err) {
            console.error('Error undoing import:', err);
            return false;
        }
    }, [user]);

    return { logs, loading, fetchLogs, createLog, undoImport };
}

export default useImportLogs;
