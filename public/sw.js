// Service Worker for Wael Inventory Management PWA
const CACHE_NAME = 'wael-inventory-v1';
const STATIC_CACHE_NAME = 'wael-inventory-static-v1';
const DYNAMIC_CACHE_NAME = 'wael-inventory-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/index.css',
  '/src/main.tsx',
  // Add other critical files
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/items/,
  /\/api\/movements/,
  /\/api\/transactions/,
  /\/api\/receipts/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with Cache Fallback
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    // Images - Cache First
    event.respondWith(handleImageRequest(request));
  } else {
    // Static files - Stale While Revalidate
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature is not available offline',
        cached: false
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to load image:', request.url);
    // Return a placeholder image or empty response
    return new Response('', { status: 404 });
  }
}

// Handle static requests with stale-while-revalidate strategy
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    // Return cached version immediately if available
    if (cachedResponse) {
      // Update cache in background
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(STATIC_CACHE_NAME)
              .then((cache) => cache.put(request, networkResponse));
          }
        })
        .catch(() => {
          // Ignore network errors for background updates
        });
      
      return cachedResponse;
    }
    
    // No cache, fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to load static resource:', request.url);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      return offlineResponse || new Response('Offline', { status: 503 });
    }
    
    return new Response('', { status: 404 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'inventory-sync') {
    event.waitUntil(syncInventoryData());
  }
});

// Sync inventory data when back online
async function syncInventoryData() {
  try {
    // Get pending actions from IndexedDB or localStorage
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove successful action from pending list
        await removePendingAction(action.id);
        console.log('Service Worker: Synced action:', action.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Helper functions for managing pending actions
async function getPendingActions() {
  // In a real implementation, this would read from IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingAction(actionId) {
  // In a real implementation, this would remove from IndexedDB
  console.log('Service Worker: Removing pending action:', actionId);
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New inventory update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Wael Inventory', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
});