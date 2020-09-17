const CACHE_NAME = 'static-cache-v1';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/param.html',
    '/scripts/app.js',
    '/scripts/install.js',
    '/styles/index.css',
    '/styles/font-awesome.min.css'
  ];
  

// Install
self.addEventListener('install', (evt) => {
    console.log('[ServiceWorker] Install');
    evt.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching offline page');
            return cache.addAll(FILES_TO_CACHE);
        })   
    );

    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (evt) => {
    console.log('[ServiceWorker] Activate');
    // CODELAB: Remove previous cached data from disk.
    evt.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    
    self.clients.claim();
});

// Fetch
// https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker
self.addEventListener('fetch', (evt) => {
    console.log('[ServiceWorker] Fetch', evt.request.url);
    evt.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(evt.request, { ignoreSearch: true })
                    .then((response) => {
                        return response || fetch(evt.request);
                    });
        })
    );
});
