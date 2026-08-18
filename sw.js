/**
 * Service Worker — habilita el modo offline / instalable (PWA).
 * Cachea el "app shell" (HTML, CSS, JS, imágenes) para que la interfaz
 * cargue sin conexión. Las llamadas a /api/ siempre van a la red: si
 * fallan, TaskModel.js ya tiene su propio respaldo a localStorage.
 */

const CACHE_NAME = 'taskmaster-shell-v1';

const APP_SHELL = [
  './',
  'index.html',
  'manifest.json',
  'assets/css/main.css',
  'assets/js/model/TaskModel.js',
  'assets/js/model/MateriaModel.js',
  'assets/js/model/QuickAddParser.js',
  'assets/js/viewmodel/TaskViewModel.js',
  'assets/js/view/HomeView.js',
  'assets/js/view/DashboardView.js',
  'assets/js/view/ModalView.js',
  'assets/js/view/PomodoroView.js',
  'assets/js/view/AuthView.js',
  'assets/js/app.js',
  'assets/img/logo.svg',
  'assets/img/feature-notify.svg',
  'assets/img/feature-reminder.svg',
  'assets/img/feature-priority.svg',
  'assets/img/guide-1.svg',
  'assets/img/guide-2.svg',
  'assets/img/guide-3.svg',
  'assets/img/empty-state.jpg',
  'assets/img/auth-hero.jpg',
  'assets/img/icon-192.png',
  'assets/img/icon-512.png',
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

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchAndUpdate = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      // Responder de inmediato con la copia en caché si existe (rápido y
      // funciona offline); si no hay caché, esperar a la red.
      return cached || fetchAndUpdate;
    })
  );
});
