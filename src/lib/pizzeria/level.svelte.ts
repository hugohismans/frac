/**
 * État d'un niveau de la Pizzeria et sa machine à états, client par client.
 *
 *   intro ─start─▶ arriving ─▶ cutting (monde 1) ─chooseCut─▶ selecting ─serve─▶ serving ─▶ feedback
 *                            └▶ selecting (mondes 2 et 3) ─────────────────────┘
 *   feedback(exact) ─▶ leaving ─▶ arriving (client suivant) | complete
 *   feedback(raté) ─retry─▶ selecting (la sélection est gardée)
 *   selecting ─recut─▶ cutting (monde 1)
 *
 * Dans le monde 3, « selecting » est la phase où l'on regroupe les parts du plateau.
 * Dans le monde 4, c'est la phase où l'on pose des restes sur le plateau et où on les recoupe.
 */

import type { Fraction } from '../fraction';
import { haptic } from '../haptics';
import { motion } from '../motion.svelte';
import { PIZZERIA } from '../settings';
import { customerFor, type CustomerInfo } from './customers';
import {
	countSelected,
	judge,
	recutAll,
	sumOf,
	judgeSimplify,
	regroup,
	servedValue,
	starsFor,
	target,
	type RegroupOutcome
} from './engine';
import { recordStars } from './progress.svelte';
import type { Level, Order, Verdict } from './types';

export type Phase =
	'intro' | 'arriving' | 'cutting' | 'selecting' | 'serving' | 'feedback' | 'leaving' | 'complete';

export interface ServeResult {
	verdict: Verdict;
	served: Fraction;
	order: Fraction;
}

export class LevelGame {
	readonly level: Level;
	index = $state(0);
	phase = $state<Phase>('intro');
	errors = $state(0);
	/** Découpe actuelle de la pizza (null tant que le joueur n'a pas choisi, monde 1). */
	cut = $state<number | null>(null);
	selected = $state<boolean[]>([]);
	/** Monde 3 : parts sur le plateau. */
	tray = $state<Fraction | null>(null);
	/** Monde 3 : regroupement en cours (les traits de coupe s'effacent). */
	merging = $state<number | null>(null);
	/** Monde 3 : regroupement impossible montré à l'enfant. */
	regroupFail = $state<Extract<RegroupOutcome, { ok: false }> | null>(null);
	/** Monde 4 : restes sur le comptoir (écriture actuelle, après recoupe éventuelle). */
	leftovers = $state<Fraction[]>([]);
	/** Monde 4 : restes posés sur le plateau. */
	onPlate = $state<boolean[]>([]);
	/** Monde 4 : découpe impossible montrée à l'enfant. */
	recutFail = $state<{ cut: number; failing: Fraction[]; indices: number[] } | null>(null);
	result = $state<ServeResult | null>(null);
	stars = $state(0);
	announce = $state('');

	order: Order = $derived.by(() => this.level.customers[this.index]);
	customer: CustomerInfo = $derived.by(() => customerFor(this.level.id, this.index));
	wanted: Fraction = $derived(target(this.order));
	selectedCount = $derived(countSelected(this.selected));
	plate: Fraction[] = $derived(this.leftovers.filter((_, i) => this.onPlate[i]));
	/** Les restes du plateau tels qu'ils étaient au départ (pour écrire l'addition). */
	plateOriginals: Fraction[] = $derived.by(() =>
		this.order.kind === 'addition' ? this.order.leftovers.filter((_, i) => this.onPlate[i]) : []
	);

	private timers = new Set<ReturnType<typeof setTimeout>>();
	private failToken = 0;

	constructor(level: Level, skipIntro = false) {
		this.level = level;
		if (skipIntro) this.start();
	}

	private later(ms: number, fn: () => void): void {
		const t = setTimeout(() => {
			this.timers.delete(t);
			fn();
		}, ms);
		this.timers.add(t);
	}

	destroy(): void {
		for (const t of this.timers) clearTimeout(t);
		this.timers.clear();
	}

	start(): void {
		if (this.phase !== 'intro') return;
		this.arrive();
	}

	private arrive(): void {
		const order = this.order;
		this.phase = 'arriving';
		this.result = null;
		this.regroupFail = null;
		this.merging = null;
		this.tray = order.kind === 'simplify' ? { ...order.tray } : null;
		this.cut =
			order.kind === 'equivalence'
				? order.imposedCut
				: order.kind === 'simplify'
					? order.tray.d
					: null;
		this.selected = this.cut && order.kind !== 'simplify' ? Array(this.cut).fill(false) : [];
		this.leftovers = order.kind === 'addition' ? order.leftovers.map((p) => ({ ...p })) : [];
		this.onPlate = order.kind === 'addition' ? order.leftovers.map(() => false) : [];
		this.recutFail = null;
		this.announce = `${this.customer.name} arrive.`;
		this.later(motion.ms(PIZZERIA.ARRIVE_MS), () => {
			this.phase = order.kind === 'parts' ? 'cutting' : 'selecting';
		});
	}

	// --- Monde 1 : découpe ---------------------------------------------------

	chooseCut(k: number): void {
		if (this.phase !== 'cutting') return;
		haptic('tap');
		this.cut = k;
		this.selected = Array(k).fill(false);
		this.phase = 'selecting';
		this.announce = `Pizza coupée en ${k} parts.`;
	}

	recut(): void {
		if (this.phase !== 'selecting' || this.order.kind !== 'parts') return;
		this.cut = null;
		this.selected = [];
		this.phase = 'cutting';
	}

	// --- Mondes 1 et 2 : sélection --------------------------------------------

	toggle(i: number): void {
		if (this.phase !== 'selecting' || this.order.kind === 'simplify') return;
		if (i < 0 || i >= this.selected.length) return;
		this.selected[i] = !this.selected[i];
		haptic('tap');
		this.announce = `${this.selectedCount} part${this.selectedCount > 1 ? 's' : ''} sur ${this.selected.length}.`;
	}

	// --- Monde 3 : regroupement -----------------------------------------------

	regroup(k: number): void {
		if (this.phase !== 'selecting' || !this.tray || this.merging) return;
		const outcome = regroup(this.tray, k);
		if (!outcome.ok) {
			const token = ++this.failToken;
			this.regroupFail = outcome;
			haptic('invalid');
			this.later(PIZZERIA.REGROUP_FAIL_MS, () => {
				if (this.failToken === token) this.regroupFail = null;
			});
			return;
		}
		this.regroupFail = null;
		this.merging = k;
		haptic('regroup');
		this.later(motion.ms(PIZZERIA.REGROUP_MS), () => {
			this.tray = outcome.value;
			this.cut = outcome.value.d;
			this.merging = null;
			this.announce = `Regroupé : ${outcome.value.n} part${outcome.value.n > 1 ? 's' : ''} sur ${outcome.value.d}.`;
		});
	}

	// --- Monde 4 : restes ---------------------------------------------------------

	toggleLeftover(i: number): void {
		if (this.phase !== 'selecting' || this.order.kind !== 'addition') return;
		if (i < 0 || i >= this.onPlate.length) return;
		this.onPlate[i] = !this.onPlate[i];
		this.recutFail = null;
		haptic('tap');
		this.announce = this.onPlate[i] ? 'Reste posé sur le plateau.' : 'Reste remis sur le comptoir.';
	}

	/** Recoupe tous les restes du plateau en parts de 1/cut. */
	recutPlate(cut: number): void {
		if (this.phase !== 'selecting' || this.plate.length === 0) return;
		const outcome = recutAll(this.plate, cut);
		if (!outcome.ok) {
			const token = ++this.failToken;
			const plateIndices = this.onPlate.flatMap((on, i) => (on ? [i] : []));
			this.recutFail = {
				cut,
				failing: outcome.failing.map((i) => this.plate[i]),
				indices: outcome.failing.map((i) => plateIndices[i])
			};
			haptic('invalid');
			this.later(PIZZERIA.REGROUP_FAIL_MS, () => {
				if (this.failToken === token) this.recutFail = null;
			});
			return;
		}
		this.recutFail = null;
		let j = 0;
		this.leftovers = this.leftovers.map((p, i) => (this.onPlate[i] ? outcome.pieces[j++] : p));
		haptic('regroup');
		this.announce = `Plateau recoupé en parts de 1 sur ${cut}.`;
	}

	// --- Service ---------------------------------------------------------------

	canServe = $derived(
		this.phase === 'selecting' &&
			!this.merging &&
			(this.order.kind === 'simplify'
				? !!this.tray
				: this.order.kind === 'addition'
					? this.plate.length > 0
					: this.selectedCount > 0)
	);

	serve(): void {
		if (!this.canServe) return;
		const served =
			this.order.kind === 'simplify'
				? this.tray!
				: this.order.kind === 'addition'
					? sumOf(this.plate)
					: servedValue(this.selected);
		const verdict =
			this.order.kind === 'simplify' ? judgeSimplify(served) : judge(served, this.wanted);
		this.regroupFail = null;
		this.recutFail = null;
		this.result = { verdict, served, order: this.wanted };
		this.phase = 'serving';
		this.later(motion.ms(PIZZERIA.SERVE_MS), () => {
			this.phase = 'feedback';
			if (verdict === 'exact') {
				haptic('serveGood');
				this.announce = `${this.customer.name} est content !`;
				this.later(PIZZERIA.HAPPY_MS, () => this.leave());
			} else {
				this.errors++;
				haptic('serveBad');
				this.announce =
					verdict === 'tooLittle'
						? 'Pas assez.'
						: verdict === 'tooMuch'
							? 'Trop.'
							: 'Bonne quantité, mais il faut encore regrouper.';
			}
		});
	}

	retry(): void {
		if (this.phase !== 'feedback' || this.result?.verdict === 'exact') return;
		this.result = null;
		this.phase = 'selecting';
	}

	private leave(): void {
		this.phase = 'leaving';
		this.later(motion.ms(PIZZERIA.LEAVE_MS), () => {
			if (this.index + 1 < this.level.customers.length) {
				this.index++;
				this.arrive();
			} else {
				this.stars = starsFor(this.errors);
				recordStars(this.level.id, this.stars);
				this.phase = 'complete';
				haptic('win');
				this.announce = `Niveau terminé : ${this.stars} étoile${this.stars > 1 ? 's' : ''}.`;
			}
		});
	}
}
