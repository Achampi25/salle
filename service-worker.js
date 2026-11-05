// Cache hors-ligne. Changer CACHE à chaque publication pour forcer la mise à jour.
const CACHE = 'salle-v1.1.0';
const IMG_CACHE = 'salle-img'; // conservé entre les versions
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/db.js',
  './js/store.js',
  './js/ui.js',
  './js/exercises.js',
  './js/exercises-view.js',
  './js/stats.js',
  './js/timer.js',
  './js/workout.js',
  './js/progress.js',
  './js/settings.js',
  './js/push.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isImg = new URL(req.url).pathname.includes('/img/');
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      // Images d'exercices : mises en cache au premier affichage (dispo hors-ligne ensuite).
      if (isImg && res.ok) {
        const copy = res.clone();
        caches.open(IMG_CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))),
  );
});

// Notifications push de fin de repos.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data?.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Repos terminé', {
    body: d.body || 'Série suivante !',
    tag: 'rest',
    renotify: true,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => (list[0] ? list[0].focus() : self.clients.openWindow('./'))),
  );
});
