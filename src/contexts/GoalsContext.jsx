import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useProfiles } from '../hooks/useProfiles';

const GoalsContext = createContext({});

export const useGoalsContext = () => useContext(GoalsContext);

export const GoalsProvider = ({ children }) => {
    const { user } = useAuth();
    const { profiles } = useProfiles();

    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastFetched, setLastFetched] = useState(0);

    const fetchGoals = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && goals.length > 0 && (now - lastFetched < 5 * 60 * 1000)) return;

        if (!user) return;

        try {
            if (goals.length === 0) setLoading(true); // only load indicator if empty

            const myProfile = profiles.find(p => p.user_id === user.id);
            if (!myProfile) return;

            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .eq('owner_id', myProfile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Recalculate progress using Transactions (Assuming this table exists and has goal_id)
            // Ideally we could use a view, but let's do Client-side join for now as per previous implementation
            const { data: investments, error: transError } = await supabase
                .from('transactions')
                .select('amount, goal_id')
                .eq('type', 'investment')
                .not('goal_id', 'is', null);

            if (transError) throw transError;

            const goalsWithProgress = data.map(goal => {
                const invested = investments
                    .filter(t => t.goal_id === goal.id)
                    .reduce((sum, t) => sum + t.amount, 0);
                return { ...goal, current_amount: invested };
            });

            setGoals(goalsWithProgress);
            setLastFetched(Date.now());
        } catch (err) {
            console.error('Error fetching goals:', err);
        } finally {
            setLoading(false);
        }
    }, [user, profiles, goals.length, lastFetched]);

    useEffect(() => {
        if (user && profiles.length > 0) {
            fetchGoals();
        }
    }, [user, profiles, fetchGoals]);

    const addGoal = async (goalData) => {
        const myProfile = profiles.find(p => p.user_id === user.id);
        if (!myProfile) throw new Error('Profile not found');

        const { error } = await supabase.from('goals').insert([{
            ...goalData,
            owner_id: myProfile.id
        }]);

        if (error) throw error;
        fetchGoals(true);
    };

    const deleteGoal = async (id) => {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) throw error;
        setGoals(prev => prev.filter(g => g.id !== id));
    };

    return (
        <GoalsContext.Provider value={{ goals, loading, addGoal, deleteGoal, fetchGoals: () => fetchGoals(true) }}>
            {children}
        </GoalsContext.Provider>
    );
};
