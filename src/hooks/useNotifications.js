import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Callbacks para sincronização entre hooks
let notificationListeners = [];

export function subscribeToNotificationChanges(callback) {
    notificationListeners.push(callback);
    return () => {
        notificationListeners = notificationListeners.filter(cb => cb !== callback);
    };
}

function notifyListeners() {
    notificationListeners.forEach(cb => cb());
}

/**
 * Hook centralizado para gerenciar notificações do app.
 * Extensível para futuros tipos de notificação.
 */
export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Fetch group invites (convites pendentes)
            const { data: invites, error } = await supabase
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

            if (error) throw error;

            // Filtrar apenas convites recebidos (não enviados por mim)
            const myIncomingInvites = (invites || []).filter(invite =>
                invite.invited_by !== user.id
            );

            // Transformar em formato de notificação
            const inviteNotifications = myIncomingInvites.map(invite => ({
                id: invite.id,
                type: 'group_invite',
                title: `Convite: ${invite.group?.name}`,
                message: 'Você foi convidado para participar',
                icon: invite.group?.icon || '📬',
                data: invite,
                createdAt: invite.created_at
            }));

            // Ordenar por data (mais recente primeiro)
            inviteNotifications.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            setNotifications(inviteNotifications);

        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Aceitar convite de grupo
    const acceptGroupInvite = async (inviteId) => {
        try {
            const { error } = await supabase.rpc('accept_invite', {
                p_invite_id: inviteId
            });
            if (error) throw error;

            // Atualizar lista de notificações
            await fetchNotifications();

            // Notificar outros listeners (como o GroupsView)
            notifyListeners();

            return true;
        } catch (err) {
            console.error('Error accepting invite:', err);
            throw err;
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    // Subscribe para atualizações de outros places
    useEffect(() => {
        const unsubscribe = subscribeToNotificationChanges(() => {
            fetchNotifications();
        });
        return unsubscribe;
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount: notifications.length,
        loading,
        acceptGroupInvite,
        refreshNotifications: fetchNotifications
    };
}
