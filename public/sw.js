/* Billing PWA service worker. PRECACHE and VERSION are filled in by tools/postbuild.mjs */
const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;
const CACHE = "billing-" + VERSION;

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const put = (req, res) => {
  if (res && res.ok && res.type === "basic") {
    const cp = res.clone();
    caches.open(CACHE).then((c) => c.put(req, cp));
  }
  return res;
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Immutable build assets: cache first
  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|ico|woff2?|webmanifest)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => put(req, res))));
    return;
  }

  // Pages and RSC payloads: network first, fall back to cache (ignoring ?id= etc.)
  e.respondWith(
    fetch(req)
      .then((res) => put(req, res))
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then(
          (r) => r || (req.mode === "navigate" ? caches.match("/", { ignoreSearch: true }) : Response.error())
        )
      )
  );
});
