const CACHE_NAME = "vibecode-v6";
const OLD_CACHES = ["vibecode-v5", "vibecode-v4", "vibecode-v3", "vibecode-v2", "vibecode-v1"];

const PRECACHE_URLS = [
  "/manifest.json",
  "/brand/icon-192.png",
  "/brand/icon-512.png",
  "/brand/apple-touch-icon.png",
  "/offline",
];

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
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME || OLD_CACHES.includes(name)) {
              return caches.delete(name);
            }
          }),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const accept = event.request.headers.get("accept") ?? "";

  // Never cache HTML: stale shells break Next.js hydration
  if (
    event.request.mode === "navigate" ||
    accept.includes("text/html") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/offline").then((r) => r || caches.match("/")),
      ),
    );
    return;
  }

  // Static brand assets: stale-while-revalidate
  if (
    url.pathname.startsWith("/brand/") ||
    url.pathname === "/manifest.json" ||
    url.pathname.startsWith("/icon-")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkFetch = fetch(event.request).then((response) => {
          if (response.ok && response.type === "basic") {
            cache.put(event.request, response.clone());
          }
          return response;
        });
        return cached ?? networkFetch;
      }),
    );
    return;
  }

  // Hashed Next.js chunks: network first, cache for offline retry
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
});
