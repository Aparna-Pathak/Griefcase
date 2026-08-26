/**
 * sw.js — Griefcase service worker
 * -----------------------------------------------------------------------
 * Strategy, kept intentionally simple for a static site:
 *   - App shell (HTML/CSS/JS/icons/manifest): cache-first, refreshed in
 *     the background on every fetch (stale-while-revalidate) so an
 *     update ships on the *next* visit without ever blocking this one.
 *   - data/content.json (the CMS content): network-first, falling back
 *     to cache — so edits show up immediately when online, and the app
 *     still opens with the last-known content when offline.
 *   - Navigations (typing the URL, opening the installed app): network
 *     first, falling back to the cached shell, falling back to
 *     offline.html as a last resort.
 *   - Cross-origin requests (Google Fonts) are left alone entirely —
 *     the browser's own HTTP cache handles those fine, and opaque
 *     cross-origin responses are easy to mishandle in a hand-rolled SW.
 *
 * Bump CACHE_VERSION whenever the shell's file list changes so old
 * clients pick up the new set instead of serving a stale mix.
 */

const CACHE_VERSION = "griefcase-v1";

const APP_SHELL = [
  "./",
  "index.html",
  "offline.html",
  "manifest.webmanifest",
  "css/variables.css",
  "css/base.css",
  "css/layout.css",
  "css/components.css",
  "css/animations.css",
  "css/responsive.css",
  "js/main.js",
  "js/modules/content-loader.js",
  "js/modules/state.js",
  "js/modules/ui-utils.js",
  "js/modules/navigation.js",
  "js/modules/reveal.js",
  "js/modules/hero-particles.js",
  "js/modules/faq.js",
  "js/modules/writer.js",
  "js/modules/release-ritual.js",
  "js/modules/library.js",
  "js/modules/interactions.js",
  "js/modules/ambient-sound.js",
  "js/modules/pwa.js",
  "data/content.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (fonts) pass through untouched

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.endsWith("/data/content.json")) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstNavigation(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match("offline.html");
  }
}

async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("offline and not cached");
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await networkFetch) || Response.error();
}
