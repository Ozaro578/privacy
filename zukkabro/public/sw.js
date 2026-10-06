/* ZUKKABRO – Service Worker für die App (installierbar, offline-fähig).
   Seiten: erst Netz, bei Ausfall Cache, sonst Offline-Seite. Bilder, Schriften, Skripte: erst Cache, dann Netz.
   Bei jedem Update die Versionsnummer erhöhen, dann werden alte Caches gelöscht. */
const VERSION = "zb-v2";
const KERN = ["/", "/offline.html", "/assets/css/style.css", "/assets/js/layout.js", "/assets/js/shop.js", "/assets/img/logo-quer.svg", "/assets/img/icon.svg",
  "/assets/fonts/titan-one-latin-400-normal.woff2", "/assets/fonts/fredoka-latin-400-normal.woff2", "/assets/fonts/fredoka-latin-600-normal.woff2", "/assets/fonts/fredoka-latin-700-normal.woff2", "/assets/fonts/rubik-wet-paint-latin-400-normal.woff2"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(KERN)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/haendler")) return;
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    e.respondWith(fetch(req).then((res) => { const kopie = res.clone(); caches.open(VERSION).then((c) => c.put(req, kopie)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match("/offline.html"))));
    return;
  }
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
    if (res.ok && /\.(css|js|woff2|svg|png|webp|jpg)$/.test(url.pathname)) { const kopie = res.clone(); caches.open(VERSION).then((c) => c.put(req, kopie)); }
    return res;
  })));
});
