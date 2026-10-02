const CACHE = 'kelime-rotasi-v5';
const ASSETS = [
  './', './index.html', './styles.css', './src/app.js', './src/learning-engine.js', './src/exercises.js',
  './src/content.js', './src/storage.js', './src/speech.js', './src/pwa.js',
  './data/words.json', './data/enrichment.json', './data/ipa.json',
  './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'
];
// A version activates only after old tabs close. Never reload an active lesson.
// Keep this list complete and bump CACHE on each deployed content/code release.
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('kelime-rotasi-') && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request)).then(hit => hit || fetch(event.request)));
});
