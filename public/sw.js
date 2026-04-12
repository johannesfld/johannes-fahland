const CACHE_NAME = "vibecode-v3";
const PRECACHE_URLS = [
  "/manifest.json",
  "/icon-192x192.svg",
  "/icon-512x512.svg",
];

// Install — precache only static assets (not HTML: stale HTML breaks Next.js hydration)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("Precache failed:", err);
      }),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const accept = event.request.headers.get("accept") ?? "";

  // Never cache-first HTML: old shells + new chunks = broken interactivity
  if (
    event.request.mode === "navigate" ||
    accept.includes("text/html") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/")),
    );
    return;
  }

  // Hashed Next chunks: network first (avoids stale bundles), cache for offline retry
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  // Other same-origin GET: network first, offline fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (
          response.ok &&
          response.type === "basic" &&
          !accept.includes("text/html")
        ) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
