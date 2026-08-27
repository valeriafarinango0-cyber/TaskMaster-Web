/**
 * Service Worker — habilita el modo offline / instalable (PWA).
 * Cachea el "app shell" (HTML, CSS, JS, imágenes) para que la interfaz
 * cargue sin conexión. Las llamadas a /api/ siempre van a la red: si
 * fallan, TaskModel.js ya tiene su propio respaldo a localStorage.
 */

const CACHE_NAME = 'taskmaster-shell-v2';

const APP_SHELL = [
  './',
  'index.html',
  'manifest.json',
  'assets/css/main.css',
  'assets/css/components.css',
  'assets/css/responsive.css',
  'assets/js/model/TaskModel.js',
  'assets/js/model/CategoriaModel.js',
  'assets/js/viewmodel/TaskViewModel.js',
  'assets/js/view/HomeView.js',
  'assets/js/view/SemanaView.js',
  'assets/js/view/ModalView.js',
  'assets/js/view/PomodoroView.js',
  'assets/js/view/AuthView.js',
  'assets/js/app.js',
  'assets/img/logo.svg',
  'assets/img/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // la API nunca se cachea

  // Network-first: mientras el proyecto está en desarrollo activo, siempre
  // se prefiere la versión más reciente del servidor. La copia en caché solo
  // se usa como respaldo si la red falla (modo offline real).
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
