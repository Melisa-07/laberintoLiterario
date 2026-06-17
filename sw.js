// service-worker.js
// Cachea los archivos estáticos de la app (HTML/CSS/JS/íconos) para que
// abra rápido y funcione aunque la conexión esté inestable. Los datos
// (libros, chat, clasificación) siempre se piden a Firebase en vivo,
// así que esto NO hace que la app funcione 100% sin internet, pero evita
// pantallas en blanco si la red está lenta.

const CACHE_NAME = "laberinto-literario-v1";
const ARCHIVOS_ESTATICOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./src/js/main.js",
  "./src/js/auth.js",
  "./src/js/libros.js",
  "./src/js/clasificacion.js",
  "./src/js/chat.js",
  "./src/js/periodo.js",
  "./src/js/ui.js",
  "./src/js/firebase-config.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_ESTATICOS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear llamadas a Firebase/Google APIs: siempre deben ir a la red.
  if (url.hostname.includes("firebase") || url.hostname.includes("googleapis") || url.hostname.includes("gstatic")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((respuestaCacheada) => {
      return (
        respuestaCacheada ||
        fetch(event.request).catch(() => caches.match("./index.html"))
      );
    })
  );
});
