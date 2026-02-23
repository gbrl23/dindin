
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useGroups() {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGroups = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            // Fetch groups where user is a member
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    role,
                    joined_at,
                    group:groups (
                        id,
                        name,
                        description,
                        icon,
                        color,
                        created_by,
                        created_at
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            // Flatten structure
            const formattedGroups = data.map(item => ({
                ...item.group,
                my_role: item.role,
                joined_at: item.joined_at
            }));

            setGroups(formattedGroups);
        } catch (err) {
            console.error('Error fetching groups:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchInvites = useCallback(async () => {
        if (!user) return;
        try {
            // My pending invites (where invited_user_id IS user OR invited_email IS user.email)
            const { data, error } = await supabase
                .from('group_invites')
                .select(`
                    id,
                    status,
                    invited_email,
                    invited_by,
                    created_at,
                    group:groups (
                        id,
                        name,
                        icon,
                        color
                    )
                `)
                .eq('status', 'pending');
            // .or(`invited_user_id.eq.${user.id},invited_email.eq.${user.email}`); 
            // Rely on RLS to return only invites I'm involved in (sent or received)
            // Then filter out the ones I sent.

            if (error) throw error;

            // Filter: Keep only invites where I am NOT the sender.
            const myIncomingInvites = (data || []).filter(invite =>
                invite.invited_by !== user.id
            );

            setInvites(myIncomingInvites);
        } catch (err) {
            console.error('Error fetching invites:', err);
            // Don't block whole UI for invites error
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchGroups();
            fetchInvites();
        }
    }, [user, fetchGroups, fetchInvites]);

    // RPC: Create Group
    const createGroup = async ({ name, description, icon, color }) => {
        try {
            const { data, error } = await supabase.rpc('create_group_with_creator', {
                p_name: name,
                p_description: description,
                p_icon: icon || '👥',
                p_color: color || '#3B82F6'
            });

            if (error) throw error;

            await fetchGroups(); // Refresh list associated groups
            return data;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    // RPC: Invite User
    const inviteUser = async (groupId, email) => {
        try {
            const { data, error } = await supabase.rpc('invite_user_by_email', {
                p_group_id: groupId,
                p_email: email
            });
            if (error) throw error;
            return data;
        } catch (err) {
            throw err;
        }
    };

    // RPC: Accept Invite
    const acceptInvite = async (inviteId) => {
        try {
            const { data, error } = await supabase.rpc('accept_invite', {
                p_invite_id: inviteId
            });
            if (error) throw error;

            await fetchGroups();
            await fetchInvites();
            return data;
        } catch (err) {
            throw err;
        }
    };

    // Update Group
    const updateGroup = async (groupId, updates) => {
        try {
            // RLS check implies user must be admin/owner
            const { error } = await supabase
                .from('groups')
                .update(updates)
                .eq('id', groupId);

            if (error) throw error;
            await fetchGroups();
        } catch (err) {
            throw err;
        }
    };

    // Delete Group
    const deleteGroup = async (groupId) => {
        try {
            // RLS check implies user must be owner
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', groupId);

            if (error) throw error;
            await fetchGroups();
        } catch (err) {
            throw err;
        }
    };

    // Leave Group (for members who are not owners)
    const leaveGroup = async (groupId) => {
        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', user.id);

            if (error) throw error;
            await fetchGroups();
        } catch (err) {
            throw err;
        }
    };

    // Calculate Balances helper (wrapper for RPC)
    const getGroupBalances = async (groupId, month = null) => {
        try {
            const params = { p_group_id: groupId };
            if (month) params.p_month = month;
            const { data, error } = await supabase.rpc('get_group_balances', params);
            if (error) throw error;
            return data;
        } catch (err) {
            console.error("Error getting balances", err);
            throw err;
        }
    };

    const getGroupMembers = useCallback(async (groupId) => {
        if (!groupId) return [];
        try {
            const { data, error } = await supabase.rpc('get_group_members_detailed', {
                p_group_id: groupId
            });

            if (error) throw error;
            return (data || []).map(m => ({
                ...m,
                name: m.full_name || m.email || 'Usuário'
            }));

        } catch (err) {
            console.error("Error getting group members detailed", err);
            return [];
        }
    }, []);

    return {
        groups,
        invites,
        loading,
        error,
        createGroup,
        inviteUser,
        acceptInvite,
        updateGroup,
        deleteGroup,
        leaveGroup,
        getGroupBalances,
        getGroupMembers,
        refreshGroups: fetchGroups,
        refreshInvites: fetchInvites
    };
}
