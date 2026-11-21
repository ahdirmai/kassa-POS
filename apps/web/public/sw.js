/* Kassa POS Service Worker — Focused on reliable /pos offline shell & asset caching */
const SHELL_CACHE = "kassa-shell-v1";
const ASSET_CACHE = "kassa-assets-v1";
const IMAGE_CACHE = "kassa-images-v1";
const ALL_CACHES = [SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE];

const PRECACHE_URLS = [
  "/pos",
  "/login",
  "/offline.html",
  "/manifest.json",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const req = new Request(url, { cache: "reload" });
            const res = await fetch(req);
            if (res && res.ok) {
              await cache.put(url, res);
            }
          } catch {
            // Skip individual precache failure so SW installation still succeeds
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !ALL_CACHES.includes(k)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (data.type === "WARM_POS_CACHE") {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        for (const url of ["/pos", "/login"]) {
          try {
            const res = await fetch(url, { credentials: "same-origin" });
            if (res && res.ok) await cache.put(url, res);
          } catch {
            // Ignore when offline
          }
        }
      })(),
    );
  }
});

// Background Sync API (Chromium): notify open tabs to flush pending offline transactions
self.addEventListener("sync", (event) => {
  if (event.tag === "kassa-offline-sync") {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of clients) {
          client.postMessage({ type: "TRIGGER_SYNC" });
        }
      })(),
    );
  }
});

function isApiOrRealtimeRequest(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/socket.io/") ||
    url.pathname === "/health"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Never intercept API or Socket.IO requests (handled by Dexie + Sync Engine)
  if (isApiOrRealtimeRequest(url)) return;

  // 1. Navigation requests (HTML documents): NetworkFirst -> Cache -> /pos or /offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          const networkRes = await fetch(request);
          if (networkRes && networkRes.ok && url.origin === self.location.origin) {
            cache.put(url.pathname, networkRes.clone()).catch(() => {});
          }
          return networkRes;
        } catch {
          const exact = await cache.match(request, { ignoreSearch: true });
          if (exact) return exact;
          const byPath = await cache.match(url.pathname);
          if (byPath) return byPath;
          if (url.pathname.startsWith("/pos")) {
            const posCached = await cache.match("/pos");
            if (posCached) return posCached;
          }
          const offlineFallback = await cache.match("/offline.html");
          if (offlineFallback) return offlineFallback;
          return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
      })(),
    );
    return;
  }

  // 2. Next.js static chunks, fonts, and public icons: CacheFirst (same-origin)
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname === "/favicon.svg" ||
      url.pathname === "/manifest.json")
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res && res.ok) {
            cache.put(request, res.clone()).catch(() => {});
          }
          return res;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // 3. Next.js App Router RSC payloads (client navigation): NetworkFirst with cache fallback
  if (url.origin === self.location.origin && (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc"))) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          const res = await fetch(request);
          if (res && res.ok) {
            cache.put(request, res.clone()).catch(() => {});
          }
          return res;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return Response.error();
        }
      })(),
    );
    return;
  }

  // 4. Product & UI Images: StaleWhileRevalidate
  if (request.destination === "image") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMAGE_CACHE);
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res && (res.ok || res.type === "opaque")) {
              cache.put(request, res.clone()).catch(() => {});
            }
            return res;
          })
          .catch(() => null);
        return cached || (await fetchPromise) || Response.error();
      })(),
    );
  }
});
