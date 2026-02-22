const CACHE_NAME = 'dindin-v2';
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
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
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
