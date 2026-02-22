import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Convert URL-safe base64 to Uint8Array for push subscription
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Hook for managing push notification subscriptions
 */
export function usePushNotifications() {
    const { user } = useAuth();
    const [permissionStatus, setPermissionStatus] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    const getPermissionStatus = useCallback(() => {
        if (typeof Notification === 'undefined') return 'unsupported';
        setPermissionStatus(Notification.permission);
        return Notification.permission;
    }, []);

    const requestPermission = useCallback(async () => {
        if (typeof Notification === 'undefined') return 'unsupported';
        const result = await Notification.requestPermission();
        setPermissionStatus(result);
        return result;
    }, []);

    const subscribe = useCallback(async () => {
        if (!user || !VAPID_PUBLIC_KEY) return null;

        try {
            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const subscriptionJson = subscription.toJSON();

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert([{
                    user_id: user.id,
                    endpoint: subscriptionJson.endpoint,
                    p256dh: subscriptionJson.keys.p256dh,
                    auth: subscriptionJson.keys.auth,
                    user_agent: navigator.userAgent,
                }], { onConflict: 'endpoint' });

            if (error) throw error;
            return subscription;
        } catch (err) {
            console.error('Error subscribing to push:', err);
            return null;
        }
    }, [user]);

    const unsubscribe = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove from Supabase
                await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('endpoint', subscription.endpoint);
            }
        } catch (err) {
            console.error('Error unsubscribing from push:', err);
        }
    }, []);

    return {
        permissionStatus,
        getPermissionStatus,
        requestPermission,
        subscribe,
        unsubscribe,
    };
}

export default usePushNotifications;
