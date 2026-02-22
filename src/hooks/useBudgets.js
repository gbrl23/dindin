import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/**
 * Calculate budget progress status based on percentage spent
 * @param {number} percentage - Percentage of budget spent (0-100+)
 * @returns {'healthy'|'warning'|'critical'|'exceeded'} Budget status
 */
export function getBudgetStatus(percentage) {
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'healthy';
}

/**
 * Enrich budgets with spending data from transactions
 * @param {Array} budgets - Budget records with category info
 * @param {Array} transactions - Transaction records for the month
 * @param {string} month - Month string in YYYY-MM format
 * @returns {Array} Budgets enriched with spent, remaining, percentage, status
 */
export function getBudgetsWithProgress(budgets, transactions, month) {
    if (!budgets || !transactions || !month) return [];

    return budgets.map(budget => {
        // Sum expenses for this category in this month
        const spent = transactions
            .filter(tx => {
                if (tx.type !== 'expense') return false;
                if (tx.category_id !== budget.category_id) return false;
                // Match by invoice_date (YYYY-MM-01) or date (YYYY-MM-DD) month
                const txMonth = tx.invoice_date
                    ? tx.invoice_date.substring(0, 7)
                    : tx.date?.substring(0, 7);
                return txMonth === month;
            })
            .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

        const amount = Number(budget.amount) || 0;
        const remaining = Math.round((amount - spent) * 100) / 100;
        const percentage = amount > 0 ? Math.round((spent / amount) * 1000) / 10 : 0;

        return {
            ...budget,
            spent: Math.round(spent * 100) / 100,
            remaining,
            percentage,
            status: getBudgetStatus(percentage),
        };
    });
}

/**
 * Hook for managing monthly budgets per category
 */
export function useBudgets() {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBudgets = useCallback(async (month) => {
        if (!user || !month) return;
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('budgets')
                .select(`
                    *,
                    category:categories!category_id(id, name, icon, color, type)
                `)
                .eq('user_id', user.id)
                .eq('month', month)
                .order('created_at');

            if (fetchError) throw fetchError;
            setBudgets(data || []);
        } catch (err) {
            console.error('Error fetching budgets:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const addBudget = useCallback(async (categoryId, amount, month) => {
        if (!user) throw new Error('User not authenticated');
        try {
            setLoading(true);
            setError(null);

            const { data, error: insertError } = await supabase
                .from('budgets')
                .insert([{
                    user_id: user.id,
                    category_id: categoryId,
                    amount: parseFloat(amount),
                    month,
                }])
                .select(`
                    *,
                    category:categories!category_id(id, name, icon, color, type)
                `)
                .single();

            if (insertError) throw insertError;
            setBudgets(prev => [...prev, data]);
            return data;
        } catch (err) {
            console.error('Error adding budget:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user]);

    const updateBudget = useCallback(async (id, amount) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: updateError } = await supabase
                .from('budgets')
                .update({ amount: parseFloat(amount) })
                .eq('id', id)
                .select(`
                    *,
                    category:categories!category_id(id, name, icon, color, type)
                `)
                .single();

            if (updateError) throw updateError;
            setBudgets(prev => prev.map(b => b.id === id ? data : b));
            return data;
        } catch (err) {
            console.error('Error updating budget:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const removeBudget = useCallback(async (id) => {
        try {
            setLoading(true);
            setError(null);

            const { error: deleteError } = await supabase
                .from('budgets')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            setBudgets(prev => prev.filter(b => b.id !== id));
        } catch (err) {
            console.error('Error removing budget:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Check budget thresholds (80%, 100%) and send notifications if not already sent.
     * @param {Array} budgetsWithProgress - Enriched budgets from getBudgetsWithProgress
     * @param {string} month - YYYY-MM
     */
    const checkBudgetThresholds = useCallback(async (budgetsWithProgress, month) => {
        if (!user || !budgetsWithProgress?.length) return;
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

        const thresholds = [100, 80];

        for (const budget of budgetsWithProgress) {
            for (const threshold of thresholds) {
                if (budget.percentage < threshold) continue;

                // Check if already sent
                const { data: existing } = await supabase
                    .from('budget_notifications_sent')
                    .select('id')
                    .eq('budget_id', budget.id)
                    .eq('month', month)
                    .eq('threshold', threshold)
                    .maybeSingle();

                if (existing) continue;

                // Record as sent
                await supabase
                    .from('budget_notifications_sent')
                    .insert([{ budget_id: budget.id, month, threshold }]);

                // Send local notification via SW
                const categoryName = budget.category?.name || 'Categoria';
                const title = threshold >= 100
                    ? `Orçamento excedido: ${categoryName}`
                    : `Alerta: ${categoryName} em ${Math.round(budget.percentage)}%`;
                const body = threshold >= 100
                    ? `Você gastou R$ ${budget.spent.toFixed(2).replace('.', ',')} de R$ ${Number(budget.amount).toFixed(2).replace('.', ',')} em ${categoryName}.`
                    : `Você já usou ${Math.round(budget.percentage)}% do orçamento de ${categoryName}.`;

                try {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.showNotification(title, {
                        body,
                        icon: '/icon-512.png',
                        badge: '/icon-512.png',
                        tag: `budget-${budget.id}-${threshold}`,
                        data: { url: '/budgets' },
                        vibrate: [100, 50, 100],
                    });
                } catch (err) {
                    console.error('Error showing budget notification:', err);
                }

                // Only send highest threshold notification per budget
                break;
            }
        }
    }, [user]);

    return {
        budgets,
        loading,
        error,
        fetchBudgets,
        addBudget,
        updateBudget,
        removeBudget,
        checkBudgetThresholds,
    };
}

export default useBudgets;
