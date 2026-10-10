import { FEEL } from './settings';

/** Suit prefers-reduced-motion en direct. */
class Motion {
	reduced = $state(false);

	constructor() {
		if (typeof window === 'undefined' || !window.matchMedia) return;
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		this.reduced = query.matches;
		query.addEventListener?.('change', (e) => (this.reduced = e.matches));
	}

	/** Durée d'une animation, réduite si le joueur le demande. */
	ms(duration: number): number {
		return this.reduced ? Math.round(duration * FEEL.REDUCED_MOTION_FACTOR) : duration;
	}
}

export const motion = new Motion();
