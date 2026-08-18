// POS offline service worker — hand-written on purpose, not built by a bundler.
//
// This file is served as-is from /public, so it works identically regardless
// of whether the app itself builds with Turbopack or webpack, and needs no
// build step of its own. It is registered with scope "/pos" only (see
// src/components/pos/register-pos-service-worker.tsx), so the browser will
// never route requests from /admin or the storefront through it.
//
// Strategy: "network falling back to cache" for same-origin GET requests.
// Every successful GET response gets cloned into the cache; when a fetch
// fails outright (offline), the last cached response is served instead. This
// requires no precache manifest or build tooling — the cache fills up
// organically just from normal use while online, which is enough to survive
// a page reload while offline. POST/PATCH requests (sales, shift actions)
// are never touched here — the page's own IndexedDB queue in
// src/lib/pos/offline-queue.ts owns retrying those.
const CACHE_NAME = "omk-pos-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }
        throw error;
      }
    })()
  );
});
