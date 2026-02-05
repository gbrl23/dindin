import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useCategories() {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            console.log('--- Fetching Categories ---', { userId: user?.id });
            // Fetch default categories (user_id is null) OR user's own categories
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .or(`user_id.is.null,user_id.eq.${user?.id || '00000000-0000-0000-0000-000000000000'}`)
                .order('name');

            console.log('Categories fetched:', { data, error });

            if (error) throw error;
            setCategories(data);
        } catch (err) {
            console.error('Error fetching categories:', err);
            // If table doesn't exist yet (before migration), we might get an error.
            // We can provide a fallback here to avoid app crash if migration isn't run yet.
            if (err.code === '42P01') { // undefined_table
                console.warn("Categories table missing. Using fallback.");
                setCategories(FALLBACK_CATEGORIES);
            } else {
                setError(err);
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { categories, loading, error, refreshCategories: fetchCategories };
}

const FALLBACK_CATEGORIES = [
    { id: '1', name: 'Casa', icon: '🏠', color: '#ef4444', type: 'expense' },
    { id: '2', name: 'Comida', icon: '🍔', color: '#f97316', type: 'expense' },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#3b82f6', type: 'expense' },
    { id: '4', name: 'Salário', icon: '💰', color: '#22c55e', type: 'income' },
    { id: '5', name: 'Outros', icon: '📦', color: '#64748b', type: 'expense' }
];
