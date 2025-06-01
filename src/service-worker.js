import { precacheAndRoute } from 'workbox-precaching';

// self.__WB_MANIFEST is injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

// Add any other custom service worker logic here if needed
// For example, custom caching strategies for API calls, etc.

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});