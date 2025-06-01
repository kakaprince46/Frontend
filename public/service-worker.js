const CACHE_NAME = 'biometric-attendance-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/assets/logo-192.png',
    '/assets/logo-512.png',
    // Add other critical assets
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching critical assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((err) => {
                console.error('Cache installation failed:', err);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('Deleting old cache:', name);
                        return caches.delete(name);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and chrome-extension
    if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
        return;
    }

    // Network-first strategy for API calls
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache successful API responses
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
    }
    // Cache-first strategy for static assets
    else {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    return cachedResponse || fetch(event.request)
                        .then((response) => {
                            // Cache new static assets
                            if (response.ok) {
                                const clone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => cache.put(event.request, clone));
                            }
                            return response;
                        });
                })
        );
    }
});

self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Background sync for offline check-ins
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-checkins') {
        console.log('Background sync triggered');
        event.waitUntil(
            syncPendingCheckins()
                .then(() => console.log('Checkins synced'))
                .catch((err) => console.error('Sync failed:', err))
        );
    }
});

async function syncPendingCheckins() {
    // Implement your sync logic here
    // Example: Get pending checkins from IndexedDB and sync with server
}
