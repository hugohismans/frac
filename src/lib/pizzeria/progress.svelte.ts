import { load, save } from '../storage';
import type { StarsRecord } from './engine';

const KEY = 'pizzeria:progress';
const VERSION = 1;

interface Progress {
	stars: StarsRecord;
}

export const progress: Progress = $state(load<Progress>(KEY, VERSION, { stars: {} }));

/** Garde le meilleur nombre d'étoiles obtenu pour un niveau. */
export function recordStars(levelId: string, stars: number): void {
	progress.stars[levelId] = Math.max(progress.stars[levelId] ?? 0, stars);
	save(KEY, VERSION, { stars: { ...progress.stars } });
}
