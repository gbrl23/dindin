const CACHE_NAME = 'dindin-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-512.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // 1. Skip non-GET requests or requests from other origins (like Supabase)
    // This allows the browser to handle them directly, avoiding SW interference.
    if (
        event.request.method !== 'GET' ||
        !event.request.url.startsWith(self.location.origin) ||
        event.request.url.includes('supabase') ||
        event.request.url.includes('/rest/') ||
        event.request.url.includes('/auth/') ||
        event.request.url.includes('/functions/')
    ) {
        return;
    }

    // 2. Handle static asset requests (GET on same origin)
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Return original response
                return response;
            })
            .catch(() => {
                // Offline fallback: check cache
                return caches.match(event.request).then((cachedResponse) => {
                    return cachedResponse || new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'text/plain' }
                    });
                });
            })
    );
});

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: 'Dindin', body: event.data ? event.data.text() : 'Você tem uma nova notificação do Dindin!' };
    }

    const options = {
        body: data.body || 'Nova notificação!',
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        data: { url: data.url || '/dashboard', type: data.type || 'general' },
        vibrate: [100, 50, 100],
        tag: data.tag || 'dindin-default',
        renotify: !!data.tag,
        actions: data.actions || [],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Dindin', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Focus existing tab if open
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
