/**
 * Règles de la Pizzeria, pures et testables.
 */

import {
	canDivideBy,
	compare,
	divideBy,
	frac,
	isIrreducible,
	simplify,
	subtract,
	type Fraction
} from '../fraction';
import { PIZZERIA } from '../settings';
import type { Level, Order, Verdict, World } from './types';

/** Ce que le client compare : la quantité servie et la commande. */
export function judge(served: Fraction, order: Fraction): Verdict {
	const c = compare(served, order);
	return c === 0 ? 'exact' : c < 0 ? 'tooLittle' : 'tooMuch';
}

/** Monde 3 : la quantité est toujours la bonne, seule la forme compte. */
export function judgeSimplify(current: Fraction): Verdict {
	return isIrreducible(current) ? 'exact' : 'notSimplest';
}

/** Écart entre commande et service, simplifié pour l'affichage (« il manque 1/8 »). */
export function difference(served: Fraction, order: Fraction): Fraction {
	const diff = subtract(order, served);
	return simplify({ n: Math.abs(diff.n), d: diff.d });
}

/** La fraction voulue par le client. */
export function target(order: Order): Fraction {
	switch (order.kind) {
		case 'simplify':
			return simplify(order.tray);
		default:
			return order.order;
	}
}

/** Une découpe permet-elle de servir exactement la commande ? */
export function cutWorks(order: Fraction, cut: number): boolean {
	return (order.n * cut) % order.d === 0;
}

/** Nombre de parts à servir avec cette découpe (null si impossible). */
export function partsNeeded(order: Fraction, cut: number): number | null {
	return cutWorks(order, cut) ? (order.n * cut) / order.d : null;
}

export type RegroupOutcome =
	| { ok: true; value: Fraction }
	| {
			ok: false;
			/** 'pizza' : les parts de la pizza ne font pas des groupes de k. 'tray' : celles du plateau non plus. */
			reason: 'pizza' | 'tray' | 'single';
			/** Ce qui reste quand on fait des paquets de k. */
			leftover: number;
			k: number;
	  };

/** Regrouper les parts k par k : possible seulement si k divise les deux nombres. */
export function regroup(value: Fraction, k: number): RegroupOutcome {
	if (k <= 1) return { ok: false, reason: 'single', leftover: 0, k };
	if (canDivideBy(value, k)) return { ok: true, value: divideBy(value, k) };
	if (value.d % k !== 0) return { ok: false, reason: 'pizza', leftover: value.d % k, k };
	return { ok: false, reason: 'tray', leftover: value.n % k, k };
}

/** Nombre de parts sélectionnées. */
export function countSelected(selected: readonly boolean[]): number {
	return selected.reduce((n, s) => n + (s ? 1 : 0), 0);
}

/** Quantité servie à partir d'une sélection de parts. */
export function servedValue(selected: readonly boolean[]): Fraction {
	return frac(countSelected(selected), Math.max(1, selected.length));
}

/** Étoiles gagnées selon le nombre de services ratés. */
export function starsFor(errors: number): 1 | 2 | 3 {
	if (errors <= PIZZERIA.STARS_3_MAX_ERRORS) return 3;
	if (errors <= PIZZERIA.STARS_2_MAX_ERRORS) return 2;
	return 1;
}

export type StarsRecord = Record<string, number>;

/** Un niveau est jouable si c'est le premier de son monde ouvert, ou si le précédent est réussi. */
export function isLevelUnlocked(level: Level, worlds: World[], stars: StarsRecord): boolean {
	const world = worlds.find((w) => w.id === level.world);
	if (!world || !isWorldUnlocked(world, worlds, stars)) return false;
	if (level.index === 1) return true;
	const previous = world.levels.find((l) => l.index === level.index - 1);
	return !!previous && (stars[previous.id] ?? 0) > 0;
}

/** Le monde 1 est ouvert ; les suivants s'ouvrent quand assez de niveaux du précédent sont réussis. */
export function isWorldUnlocked(world: World, worlds: World[], stars: StarsRecord): boolean {
	if (world.comingSoon) return false;
	const index = worlds.findIndex((w) => w.id === world.id);
	if (index <= 0) return true;
	const previous = worlds[index - 1];
	const done = previous.levels.filter((l) => (stars[l.id] ?? 0) > 0).length;
	return done >= Math.min(PIZZERIA.WORLD_UNLOCK_COUNT, previous.levels.length);
}

/** Niveau suivant dans l'ordre (même monde, puis monde suivant), ou null. */
export function nextLevel(level: Level, worlds: World[]): Level | null {
	const all = worlds.flatMap((w) => w.levels);
	const i = all.findIndex((l) => l.id === level.id);
	return i >= 0 && i + 1 < all.length ? all[i + 1] : null;
}
