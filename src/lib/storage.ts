/**
 * Petit wrapper autour de localStorage : jamais d'exception (navigation privée,
 * stockage plein ou bloqué), et un numéro de version par clé pour pouvoir migrer.
 */

const PREFIX = 'fractio:';

interface Envelope<T> {
	v: number;
	data: T;
}

function storage(): Storage | null {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage;
	} catch {
		return null;
	}
}

export function load<T>(key: string, version: number, fallback: T): T {
	try {
		const raw = storage()?.getItem(PREFIX + key);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw) as Envelope<T>;
		if (parsed?.v !== version) return fallback;
		return parsed.data;
	} catch {
		return fallback;
	}
}

export function save<T>(key: string, version: number, data: T): void {
	try {
		storage()?.setItem(PREFIX + key, JSON.stringify({ v: version, data } satisfies Envelope<T>));
	} catch {
		// Stockage indisponible : le jeu continue sans sauvegarde.
	}
}

export function remove(key: string): void {
	try {
		storage()?.removeItem(PREFIX + key);
	} catch {
		// Rien à faire.
	}
}
