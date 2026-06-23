// SnowRealm Insight Engine — Service Worker
// 版本號 - 改這裡可強制所有用戶更新快取
const CACHE_VERSION = 'v2'
const CACHE_NAME = `insight-engine-${CACHE_VERSION}`

// 預快取的核心靜態資源
const PRECACHE_URLS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png',
]

// ── Install ──────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// ── Activate（清除舊版快取）─────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('insight-engine-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// ── Fetch ────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只處理同源請求
  if (url.origin !== location.origin) return

  // API routes — 完全不快取，直接走網路
  if (url.pathname.startsWith('/api/')) return

  // 頁面導航（HTML）— Network ONLY（不快取 HTML！）
  // 原本會 cache HTML，但部署後新 HTML 參照新 hash 的 JS chunk；舊快取 HTML 參照到「已不存在的 chunk」
  // → 整站每頁在瀏覽器卡死（curl 不跑 JS 所以照樣快）。改成永遠走網路、絕不回傳快取 HTML。
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request))
    return
  }

  // 靜態資源（圖片、字型、JS、CSS）— Cache First
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot)$/i) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // 其他請求 — Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

// ── Push 通知（未來擴充用）──────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data = { title: 'Insight Engine', body: '你有新的通知', icon: '/icons/icon-192.png' }
  try { data = { ...data, ...event.data.json() } } catch { /* ignore */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: '/icons/icon-192.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus()
      return clients.openWindow('/')
    })
  )
})
