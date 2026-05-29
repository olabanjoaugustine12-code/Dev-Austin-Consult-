const CACHE_NAME = "devaustin-v9";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/about.html",
  "/start-project.html",
  "/StartProject.css",
  "/about.css",
   "/consult.css",
   "/consult.js",
  "/manifest.json,
  "/thank-you.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] caching app shell...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});


self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cachesNames) => 
    Promise.all(
      cachesNames
      .filter((name) => name !== CACHE_NAME)
      .map((name) => {
        console.log("[SW] Deleting old cache:" , name);
        return caches.delete(name);
      })
    ))
  );
  self.clients.claim();
});


self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then ((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
      .then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type === "opaque"
        ){
          return networkResponse;
        }

        const ressponseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, ressponseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        if (event.request.destination === "document"){
          return caches.match("/index.html");
        }
      });
    })
  );
});
