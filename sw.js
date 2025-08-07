const CACHE_NAME = 'disaster-bio-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      await uploadToFirebase(offlineData);
      await clearOfflineData();
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

async function getOfflineData() {
  return JSON.parse(localStorage.getItem('offlineVictims') || '[]');
}

async function uploadToFirebase(data) {
  // Firebase upload implementation would go here
  console.log('Uploading to Firebase:', data);
}

async function clearOfflineData() {
  localStorage.removeItem('offlineVictims');
}