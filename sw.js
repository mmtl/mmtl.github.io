const SW_VERSION = 3;
const CACHE_NAME = 'static-cache-v3g';
const FILES_TO_CACHE = [
    './index.html',
    './styles/index.css',
    './images/favicon.ico',
    './images/icons/icon-128x128.png',
    './images/icons/icon-256x256.png',
    './images/icons/icon-512x512.png',
    './images/ui/close.png',
    './images/ui/close_focus.png',
    './images/ui/ic_slider.png',
    './images/ui/next_focus.png',
    './images/ui/next.png',
    './images/ui/previous_focus.png',
    './images/ui/previous.png',
    './images/ui/sound_click.png',
    './images/ui/sound_default.png',
];
const SW_DEBUG = true;

// Install
self.addEventListener('install', (event) => {
    if (SW_DEBUG) console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            if (SW_DEBUG) console.log('[ServiceWorker] Pre-caching offline page');
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
    if (SW_DEBUG) console.log('[ServiceWorker] Activate');
    // Remove previous cached data from disk.
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    if (SW_DEBUG) console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    
    self.clients.claim();

    /*
    event.waitUntil(
        clients.matchAll().then((clients) => {
            clients.forEach(client => {
                const url = new URL(client.url);
                if (url.pathname.indexOf("index.html") >= 0) {
                    if (SW_DEBUG) console.log('[ServiceWorker] Post message activated');
                    client.postMessage({'activated': true});
                }
            });
        })
    );
    */
});

const handleErrors = (res) => {
    if (res.ok) {
      return res;
    }
  
    if (SW_DEBUG) console.log('[ServiceWorker] res.status = ' + res.status);
    switch (res.status) {
    case 400: throw Error('BAD_REQUEST');
    case 500: throw Error('INTERNAL_SERVER_ERROR');
    case 502: throw Error('BAD_GATEWAY');
    case 404: throw Error('NOT_FOUND');
    default: throw Error(res.status + ' UNHANDLED_ERROR');
    } 
};

// Fetch
// https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker
self.addEventListener('fetch', (event) => {
    if (SW_DEBUG) console.log('[ServiceWorker] Fetch', event.request.url);
    const requestUrl = event.request.url;
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(event.request, { ignoreSearch: true });

            if (cachedResponse) {
                if (SW_DEBUG) console.log('[ServiceWorker] Fetch returns cached response of ' + requestUrl);
                return cachedResponse;
            } else {
                return fetch(event.request, {cache: "no-cache"});
            }
        })
    );
});
// When the requested URL is not in the cache, i.e., when the resource can be retrieved by fetch(event.request), it is added to the cache.
// I've heard that a response (or request) can only be referenced once, so I'm referring to a duplicate.
// That's why it's response.clone() instead of response that's added to the cache.
/*
fetch(event.request).then(async (response) => {
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, response.clone());
                return response;
            });
*/

// About Cache size
// https://love2dev.com/blog/what-is-the-service-worker-cache-storage-limit/
// Basically, the ratio of that machine's hard disk space to its capacity.
// The general rule of thumb is 50MB of cache storage quota for 20GB.

// Example of returning a resource of the same name in the /offline/ directory when offline
/**
caches.open('cache-v1').then(function(cache){
　let req = new URL('/offline/', event.request);
  return cache.match(req).then(function(response) {
    return response;
  });
})
 */
// The offline status is determined by the value of the navigator.onLine or by the result of a test fetch.

// About file update
// When the app starts up, it starts up with the version already have in the store, and if there is an update, it will get it.
// Then, apply the update the next time it starts up, which prioritizes being able to start up reliably even when it's offline.
// In other words, you have to reload at least twice before it will be replaced.
