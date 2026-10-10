/** Générateur aléatoire injectable : renvoie un nombre dans [0, 1[. */
export type Rng = () => number;

export const defaultRng: Rng = () => Math.random();

/** Générateur déterministe (mulberry32), pour les tests et les parties rejouables. */
export function seededRng(seed: number): Rng {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Entier dans [0, max[. */
export function randomInt(rng: Rng, max: number): number {
	return Math.floor(rng() * max);
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
	return items[randomInt(rng, items.length)];
}

export function pickWeighted<T extends { weight: number }>(rng: Rng, items: readonly T[]): T {
	const total = items.reduce((sum, item) => sum + item.weight, 0);
	let r = rng() * total;
	for (const item of items) {
		r -= item.weight;
		if (r < 0) return item;
	}
	return items[items.length - 1];
}
