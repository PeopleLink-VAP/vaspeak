/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

// ─── Cache names ──────────────────────────────────────────────────────────────
const CACHE_NAME  = `vaspeak-v${version}`;
const STATIC_NAME = `vaspeak-static-v${version}`;

// Assets bundled by Vite (JS, CSS) + static files (icons, manifest, images)
const STATIC_ASSETS = [...build, ...files, ...prerendered];

// ─── Install: pre-cache static assets ─────────────────────────────────────────
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(STATIC_NAME).then((cache) =>
			cache.addAll(STATIC_ASSETS)
		).then(() => self.skipWaiting())
	);
});

// ─── Activate: delete old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			for (const key of keys) {
				if (key !== CACHE_NAME && key !== STATIC_NAME) {
					await caches.delete(key);
				}
			}
		}).then(() => self.clients.claim())
	);
});

// ─── Fetch strategy ───────────────────────────────────────────────────────────
//
// Navigation requests (HTML pages):  Network-first, fall back to cache.
//   Reason: SSR page data must be fresh; falling back enables offline shell.
//
// API requests (/api/*, /admin/api/*): Network-only.
//   Reason: Never serve stale API data. Fail fast, let UI handle error.
//
// Static assets (JS, CSS, icons):     Cache-first.
//   Reason: Hashed filenames; safe to serve from cache indefinitely.
//
// Everything else:                    Network-first, cache on success.

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Only intercept same-origin requests
	if (url.origin !== self.location.origin) return;

	// API — network only
	if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/api/')) {
		return; // let the browser handle it normally
	}

	// Static assets already in the static cache — cache first
	if (STATIC_ASSETS.includes(url.pathname)) {
		event.respondWith(
			caches.match(request).then((cached) => cached ?? fetch(request))
		);
		return;
	}

	// Navigation (HTML) — network first, fall back to cached shell
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cache successful navigation responses (only valid for GET and non-partial)
					if (response.ok && request.method === 'GET' && response.status !== 206) {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((c) => c.put(request, clone));
					}
					return response;
				})
				.catch(async () => {
					// Offline: serve cached version if available, else offline shell
					const cached = await caches.match(request);
					if (cached) return cached;
					// Last resort: serve the dashboard shell from cache
					return (await caches.match('/dashboard')) ?? Response.error();
				})
		);
		return;
	}

	// Everything else — network first, cache on success
	event.respondWith(
		fetch(request)
			.then((response) => {
				// Only cache successful GET requests that are not partial responses (206)
				if (response.ok && request.method === 'GET' && response.status !== 206) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((c) => c.put(request, clone));
				}
				return response;
			})
			.catch(() => caches.match(request).then((r) => r ?? Response.error()))
	);
});

// ─── Push notifications (future) ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
	if (!event.data) return;
	try {
		const data = event.data.json() as { title: string; body: string; url?: string };
		event.waitUntil(
			self.registration.showNotification(data.title, {
				body:    data.body,
				icon:    '/icon-192.png',
				badge:   '/icon-192.png',
				data:    { url: data.url ?? '/dashboard' }
			})
		);
	} catch { /* ignore malformed push */ }
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = (event.notification.data as { url?: string })?.url ?? '/dashboard';
	event.waitUntil(
		self.clients.matchAll({ type: 'window' }).then((clients) => {
			for (const client of clients) {
				if (client.url === url && 'focus' in client) return client.focus();
			}
			return self.clients.openWindow(url);
		})
	);
});
