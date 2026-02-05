import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useProfiles } from '../hooks/useProfiles';

const CardsContext = createContext({});

export const useCardsContext = () => useContext(CardsContext);

export const CardsProvider = ({ children }) => {
    const { user } = useAuth();
    const { profiles } = useProfiles();

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetched, setLastFetched] = useState(0);

    const fetchCards = useCallback(async (force = false) => {
        // Cache validity: 5 minutes if not forced
        const now = Date.now();
        if (!force && cards.length > 0 && (now - lastFetched < 5 * 60 * 1000)) {
            return;
        }

        if (!user) return;

        try {
            // Don't set loading true if we already have data (background update)
            if (cards.length === 0) setLoading(true);

            // Get my profile ID
            const myProfile = profiles.find(p => p.user_id === user?.id);
            if (!myProfile) {
                // If profiles aren't loaded yet, try again later or wait
                // but checking profiles.length > 0 in useEffect handles this
                return;
            }

            const { data, error } = await supabase
                .from('cards')
                .select('*')
                .eq('owner_id', myProfile.id)
                .order('name', { ascending: true });

            if (error) throw error;

            setCards(data);
            setLastFetched(Date.now());
        } catch (err) {
            console.error('Error fetching cards:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user, profiles, cards.length, lastFetched]);

    // Initial Fetch
    useEffect(() => {
        if (user && profiles.length > 0) {
            fetchCards();
        } else if (!user) {
            setCards([]);
        }
    }, [user, profiles, fetchCards]);


    // CRUD Operations
    const addCard = async (cardData) => {
        if (!user) return;
        try {
            const myProfile = profiles.find(p => p.user_id === user.id);
            if (!myProfile) throw new Error("Profile not found");

            const newCard = {
                owner_id: myProfile.id,
                name: cardData.name,
                type: 'credit',
                closing_day: parseInt(cardData.closingDay),
                due_day: parseInt(cardData.dueDay),
                limit: 0,
                color: cardData.color || '#8B5CF6',
                brand: cardData.brand || 'other',
                last_4_digits: cardData.last4 || null
            };

            const { data, error } = await supabase
                .from('cards')
                .insert([newCard])
                .select()
                .single();

            if (error) throw error;

            // Optimistic Update
            setCards(prev => [...prev, data]);
            return data;
        } catch (err) {
            console.error('Error adding card:', err);
            throw err;
        }
    };

    const updateCard = async (id, updates) => {
        try {
            const cleanUpdates = {
                name: updates.name,
                closing_day: parseInt(updates.closingDay),
                due_day: parseInt(updates.dueDay),
                color: updates.color,
                brand: updates.brand,
                last_4_digits: updates.last4
            };

            const { data, error } = await supabase
                .from('cards')
                .update(cleanUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setCards(prev => prev.map(c => c.id === id ? data : c));
            return data;
        } catch (err) {
            console.error('Error updating card:', err);
            throw err;
        }
    };

    const removeCard = async (id) => {
        try {
            const { error } = await supabase
                .from('cards')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setCards(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('Error deleting card:', err);
            throw err;
        }
    };

    return (
        <CardsContext.Provider value={{ cards, loading, error, addCard, updateCard, removeCard, refreshCards: () => fetchCards(true) }}>
            {children}
        </CardsContext.Provider>
    );
};
