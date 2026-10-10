/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

/**
 * Service worker de Fractio : tout le site est mis en cache à l'installation,
 * pour qu'on puisse jouer sans connexion.
 *
 * - Fichiers de build (noms avec empreinte) et fichiers statiques : cache d'abord.
 * - Pages : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
 * Chaque nouvelle version a son propre cache ; les anciens sont supprimés à l'activation.
 */

import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { self } from '$app/service-worker';

const CACHE = `fractio-${version}`;

/** Chemins relatifs à la base du site, résolus par rapport à l'emplacement du service worker. */
const scope = new URL('./', self.location.href);
const url = (path: string) => new URL(path.replace(/^\//, ''), scope).href;

const STATIC = new Set(
	[...immutable, ...assets]
		.filter((f) => !f.path.split('/').some((part) => part.startsWith('.')))
		.map((f) => url(f.path))
);
const PAGES = new Set([scope.href, ...prerendered.map((p) => url(p.path))]);

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			// Les fichiers de build sont indispensables ; un fichier statique ou une page manquante
			// ne doit pas empêcher l'installation.
			await cache.addAll(immutable.map((f) => url(f.path)));
			await Promise.allSettled(
				[...STATIC, ...PAGES].map(async (href) => {
					if (!(await cache.match(href))) await cache.add(href);
				})
			);
			await self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key !== CACHE) await caches.delete(key);
			}
			await self.clients.claim();
		})()
	);
});

/** Les pages sont en cache sous leur adresse sans « .html » ni barre finale. */
function pageKey(request: URL): string {
	const clean = new URL(request.href);
	clean.search = '';
	clean.hash = '';
	clean.pathname = clean.pathname.replace(/\.html$/, '');
	if (clean.pathname !== new URL(scope.href).pathname) {
		clean.pathname = clean.pathname.replace(/\/$/, '');
	}
	return clean.href;
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const requestUrl = new URL(request.url);
	if (requestUrl.origin !== self.location.origin || !requestUrl.href.startsWith(scope.href)) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			// Fichiers de build et statiques : jamais modifiés pour une version donnée.
			if (STATIC.has(requestUrl.href)) {
				const cached = await cache.match(requestUrl.href);
				if (cached) return cached;
			}

			// Le reste : réseau d'abord, cache en secours.
			try {
				const response = await fetch(request);
				if (response.ok && request.mode === 'navigate') {
					cache.put(pageKey(requestUrl), response.clone());
				}
				return response;
			} catch (error) {
				const cached =
					(await cache.match(request)) ??
					(await cache.match(pageKey(requestUrl))) ??
					(request.mode === 'navigate' ? await cache.match(scope.href) : undefined);
				if (cached) return cached;
				throw error;
			}
		})()
	);
});
