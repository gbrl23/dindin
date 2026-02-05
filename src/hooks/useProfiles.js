
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useProfiles() {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            fetchProfiles();
        } else {
            setProfiles([]);
            setLoading(false);
        }
    }, [user]);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Compute isOwner flag (if the profile is the current user's own profile)
            const enhancedProfiles = data.map(p => ({
                ...p,
                name: p.full_name, // Map for compatibility with existing UI
                isOwner: p.user_id === user?.id
            }));

            setProfiles(enhancedProfiles);
        } catch (err) {
            console.error('Error fetching profiles:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const addProfile = async (name, email = null) => {
        if (!user) return;
        try {
            // Find current user's profile ID
            const myProfile = profiles.find(p => p.user_id === user.id);
            if (!myProfile) {
                console.error("User profile not found, cannot create ghost user");
                return;
            }

            const newProfile = {
                full_name: name,
                email: email,
                created_by: myProfile.id, // Correctly link to PROFILE ID
                user_id: null
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

            setProfiles(prev => prev.map(p => p.id === id ? { ...data, name: data.full_name, isOwner: p.user_id === user?.id } : p));
            return data;
        } catch (err) {
            console.error('Error updating profile:', err);
            throw err;
        }
    };

    // Get my profile (current user's profile)
    const myProfile = profiles.find(p => p.user_id === user?.id);

    return { profiles, myProfile, loading, error, addProfile, removeProfile, updateProfile, refreshProfiles: fetchProfiles };
}
