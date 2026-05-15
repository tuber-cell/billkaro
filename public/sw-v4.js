const CACHE_NAME = "billby-v3";
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.json",
    "/favicon.ico",
    "/favicon.svg",
    "/favicon_32x32.png",
    "/favicon_192x192.png",
    "/favicon_512x512.png"
];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener("fetch", (event) => {
    // Strategy: Network First for HTML/Navigation, Cache First for others
    const isHtml = event.request.mode === "navigate" || 
                 (event.request.method === "GET" && 
                  event.request.headers.get("accept")?.includes("text/html"));

    if (isHtml) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, copy);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then((fetchRes) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, fetchRes.clone());
                        return fetchRes;
                    });
                });
            })
        );
    }
});
