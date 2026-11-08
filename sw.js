const CACHE = 'inicio-v4';
const IMAGE_CACHE = 'inicio-images-v1';
const MAX_IMAGES = 60;
const IMAGE_HOSTS = new Set(['i.ytimg.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com']);
const ASSETS = ['./', './index.html', './style.css', './visual.css', './app.js', './widgets.js', './manifest.webmanifest', './icon.svg', './background.js', './assets/background.jpg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('inicio-') && key !== CACHE && key !== IMAGE_CACHE)
    .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

// Serialize image writes so concurrent downloads cannot leave an oversized cache.
let imageWrites = Promise.resolve();
function saveImage(request, response) {
  imageWrites = imageWrites.catch(() => {}).then(async () => {
    const cache = await caches.open(IMAGE_CACHE);
    await cache.put(request, response);
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_IMAGES)).map(key => cache.delete(key)));
  });
  return imageWrites.catch(() => {});
}

async function imageResponse(event) {
  const request = event.request;
  const cached = await caches.open(IMAGE_CACHE).then(cache => cache.match(request)).catch(() => undefined);
  if (cached) return cached;
  try {
    // Public artwork only: do not forward cookies or browser credentials.
    const response = await fetch(new Request(request, { credentials: 'omit' }));
    if (response.ok || response.type === 'opaque') {
      event.waitUntil(saveImage(request, response.clone()));
    }
    return response;
  } catch {
    // The DOM supplies an initials/icon fallback when an image cannot load.
    return Response.error();
  }
}

async function localResponse(event) {
  const request = event.request;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {}));
    }
    return response;
  } catch {
    const cache = await caches.open(CACHE);
    return await cache.match(request) || (request.mode === 'navigate' ? await cache.match('./index.html') : null) || Response.error();
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('Authorization') || request.headers.has('X-APIKEY') || request.headers.has('X-API-Key')) return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(localResponse(event));
  } else if (request.destination === 'image' && url.protocol === 'https:' && IMAGE_HOSTS.has(url.hostname)) {
    event.respondWith(imageResponse(event));
  }
});
