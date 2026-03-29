const CACHE_NAME = 'moodtrace-v5';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
];

// API 请求超时
const API_TIMEOUT_MS = 5000;

// Install event — pre-cache shell，激活后立即接管
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate event — 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// 判断是否为带 hash 的构建产物（Vite 输出的 assets 目录下的文件）
// 这类文件名包含 hash，内容不可变，可以安全使用 cache-first
function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/') && /\.[a-f0-9]{8,}\.(js|css|woff2?|svg|png|jpg|webp)$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只处理 GET 和 http(s) 请求
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // API 请求：network-first，超时降级
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API timeout')), API_TIMEOUT_MS)
        ),
      ]).catch(() =>
        new Response(JSON.stringify({ error: 'offline', message: '网络不可用' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // 带 hash 的构建产物（JS/CSS/字体/图片）：cache-first
  // 文件名含 hash = 内容不可变，缓存命中直接返回，不发网络请求
  if (url.origin === self.location.origin && isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 导航请求（HTML 页面）：network-first，失败用缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 同源其他资源（未带 hash 的）：stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 跨域（如 Google Fonts）：network-first，缓存降级
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
