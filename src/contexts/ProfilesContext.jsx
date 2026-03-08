import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const ProfilesContext = createContext(null);

export function ProfilesProvider({ children }) {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchingRef = useRef(false);

    const fetchProfiles = useCallback(async () => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            setProfiles(data.map(p => ({
                ...p,
                name: p.full_name || p.email || 'Usuário',
                isOwner: p.user_id === user?.id,
            })));
        } catch (err) {
            console.error('Error fetching profiles:', err);
            setError(err);
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [user?.id]);

    useEffect(() => {
        if (user) {
            fetchProfiles();
        } else {
            setProfiles([]);
            setLoading(false);
        }
    }, [user, fetchProfiles]);

    const addProfile = async (name, email = null) => {
        if (!user) return;
        try {
            const myProfile = profiles.find(p => p.user_id === user.id);
            if (!myProfile) {
                console.error("User profile not found, cannot create ghost user");
                return;
            }

            const newProfile = {
                full_name: name,
                email: email,
                created_by: myProfile.id,
                user_id: null,
            };

            const { data, error } = await supabase
                .from('profiles')
                .insert([newProfile])
                .select()
                .single();

            if (error) throw error;

            setProfiles(prev => [...prev, { ...data, name: data.full_name, isOwner: false }]);
            return data;
        } catch (err) {
            console.error('Error adding profile:', err);
            throw err;
        }
    };

    const removeProfile = async (id) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setProfiles(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Error deleting profile:', err);
            throw err;
        }
    };

    const updateProfile = async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setProfiles(prev => prev.map(p =>
                p.id === id ? { ...data, name: data.full_name, isOwner: p.user_id === user?.id } : p
            ));
            return data;
        } catch (err) {
            console.error('Error updating profile:', err);
            throw err;
        }
    };

    const myProfile = profiles.find(p => p.user_id === user?.id);

    return (
        <ProfilesContext.Provider value={{
            profiles,
            myProfile,
            loading,
            error,
            addProfile,
            removeProfile,
            updateProfile,
            refreshProfiles: fetchProfiles,
        }}>
            {children}
        </ProfilesContext.Provider>
    );
}

export function useProfiles() {
    const context = useContext(ProfilesContext);
    if (!context) {
        throw new Error('useProfiles must be used within a ProfilesProvider');
    }
    return context;
}
