import { HAPTICS } from './settings';
import { prefs } from './prefs.svelte';

export type HapticKind = Exclude<keyof typeof HAPTICS, 'ENABLED_BY_DEFAULT'>;

/** Vibre si l'appareil le permet et si le joueur l'a laissé activé. Sinon, ne fait rien. */
export function haptic(kind: HapticKind): void {
	if (!prefs.haptics) return;
	const pattern = HAPTICS[kind];
	if (pattern === 0) return;
	try {
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate(pattern as number | number[]);
		}
	} catch {
		// Fallback silencieux.
	}
}
