import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for managing user notification preferences
 */
export function useNotificationPreferences() {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchPreferences = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setPreferences(data);
            } else {
                // Create default preferences
                const { data: newData, error: insertError } = await supabase
                    .from('notification_preferences')
                    .insert([{ user_id: user.id }])
                    .select('*')
                    .single();

                if (insertError) throw insertError;
                setPreferences(newData);
            }
        } catch (err) {
            console.error('Error fetching notification preferences:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const updatePreference = useCallback(async (key, value) => {
        if (!user || !preferences) return;
        try {
            const updates = { [key]: value };

            // If disabling master toggle, disable all
            if (key === 'enabled' && !value) {
                updates.bills_due = false;
                updates.budget_exceeded = false;
                updates.group_activity = false;
            }

            const { data, error } = await supabase
                .from('notification_preferences')
                .update(updates)
                .eq('user_id', user.id)
                .select('*')
                .single();

            if (error) throw error;
            setPreferences(data);
        } catch (err) {
            console.error('Error updating notification preference:', err);
        }
    }, [user, preferences]);

    return { preferences, loading, fetchPreferences, updatePreference };
}

export default useNotificationPreferences;
