/**
 * État d'une partie de Fraction 2048 et sa machine à états.
 *
 *   idle ──move──▶ moving ──(fin du glissement, apparition)──▶ idle | won | over
 *   idle ──tap(tuile simplifiable)──▶ idle + sélection ──pick(k)──▶ idle
 *   won ──continue──▶ idle          * ──newGame──▶ idle
 *
 * La sélection et l'aide (appui long) sont des sous-états orthogonaux de idle.
 * Un swipe pendant `moving` est mémorisé et joué juste après.
 */

import { isEquivalent, toString, type Fraction } from '../fraction';
import { haptic } from '../haptics';
import { motion } from '../motion.svelte';
import { defaultRng, type Rng } from '../rng';
import { FEEL, G2048 } from '../settings';
import { load, remove, save } from '../storage';
import {
	canMove,
	divisorChoices,
	isOne,
	mergePoints,
	move,
	simplifyBy,
	simplifyPoints,
	spawn,
	wholeValue,
	type Direction,
	type Tile
} from './engine';

export type Phase = 'idle' | 'moving' | 'won' | 'over';

export type TileState = 'still' | 'new' | 'merged' | 'ghost' | 'simplified';

export interface TileView extends Tile {
	state: TileState;
	/** Pour une tuile simplifiée : le diviseur utilisé et l'ancienne écriture. */
	divisor?: number;
	before?: Fraction;
}

export interface Toast {
	id: number;
	text: string;
	tone: 'good' | 'info' | 'oops';
}

export interface Gain {
	id: number;
	points: number;
	label?: string;
}

interface SavedGame {
	tiles: Tile[];
	score: number;
	combo: number;
	movesSinceSimplify: number;
	reachedOne: boolean;
	milestones: number[];
	nextId: number;
	over: boolean;
}

const SAVE_KEY = '2048:game';
const BEST_KEY = '2048:best';
const VERSION = 1;

export class Game2048 {
	tiles = $state<TileView[]>([]);
	phase = $state<Phase>('idle');
	score = $state(0);
	best = $state(0);
	combo = $state(0);
	selectedId = $state<number | null>(null);
	choices = $state<number[]>([]);
	rejected = $state<number[]>([]);
	helpId = $state<number | null>(null);
	shakeId = $state<number | null>(null);
	reachedOne = $state(false);
	toast = $state<Toast | null>(null);
	gain = $state<Gain | null>(null);
	/** Texte lu par les lecteurs d'écran (région aria-live). */
	announce = $state('');

	selected = $derived(
		this.tiles.find((t) => t.id === this.selectedId && t.state !== 'ghost') ?? null
	);
	helpTile = $derived(this.tiles.find((t) => t.id === this.helpId && t.state !== 'ghost') ?? null);

	private milestones: number[] = [];
	private movesSinceSimplify = 0;
	private nextIdValue = 1;
	private queued: Direction | null = null;
	private timers = new Set<ReturnType<typeof setTimeout>>();
	private eventId = 0;
	private rng: Rng;

	constructor(rng: Rng = defaultRng) {
		this.rng = rng;
		this.best = load(BEST_KEY, VERSION, 0);
		if (!this.restore()) this.newGame();
	}

	private nextId = () => this.nextIdValue++;

	private later(ms: number, fn: () => void): void {
		if (ms <= 0) {
			fn();
			return;
		}
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

	newGame(): void {
		this.destroy();
		this.tiles = [];
		this.score = 0;
		this.combo = 0;
		this.movesSinceSimplify = 0;
		this.reachedOne = false;
		this.milestones = [];
		this.queued = null;
		this.selectedId = null;
		this.helpId = null;
		this.toast = null;
		this.gain = null;
		const start: Tile[] = [];
		for (let i = 0; i < G2048.START_TILES; i++) {
			const t = spawn(start, this.rng, this.nextId);
			if (t) start.push(t);
		}
		this.tiles = start.map((t) => ({ ...t, state: 'new' }));
		this.phase = 'idle';
		this.announce = 'Nouvelle partie.';
		this.persist();
	}

	// -------------------------------------------------------------------------
	// Déplacements
	// -------------------------------------------------------------------------

	move(dir: Direction): void {
		if (this.phase === 'moving') {
			this.queued = dir;
			return;
		}
		if (this.phase !== 'idle') return;

		const current = this.tiles.filter((t) => t.state !== 'ghost');
		const result = move(current, dir, this.nextId);
		this.helpId = null;
		if (!result.moved) {
			haptic('tap');
			return;
		}
		this.selectedId = null;
		this.rejected = [];

		const mergedIds = new Set(result.merges.map((m) => m.id));
		this.tiles = [
			...result.ghosts.map((g) => ({ ...g, state: 'ghost' as const })),
			...result.tiles.map((t) => ({
				...t,
				state: mergedIds.has(t.id) ? ('merged' as const) : ('still' as const)
			}))
		];
		this.phase = 'moving';

		let gained = 0;
		let firstOne = false;
		const newMilestones: number[] = [];
		for (const m of result.merges) {
			gained += mergePoints(m.value);
			if (!this.reachedOne && isOne(m.value)) firstOne = true;
			const whole = wholeValue(m.value);
			if (
				whole !== null &&
				whole > 1 &&
				(G2048.MILESTONES as readonly number[]).includes(whole) &&
				!this.milestones.includes(whole)
			) {
				newMilestones.push(whole);
			}
		}
		if (firstOne) gained += G2048.FIRST_WHOLE_BONUS;
		if (gained > 0) this.addPoints(gained);

		this.movesSinceSimplify++;
		if (this.movesSinceSimplify >= G2048.COMBO_RESET_AFTER_MOVES) this.combo = 0;

		haptic(result.merges.length > 0 ? 'merge' : 'move');
		if (result.merges.length > 0) {
			this.announce = result.merges.map((m) => `Fusion : ${toString(m.value)}`).join('. ');
		}

		this.later(motion.ms(G2048.SLIDE_MS), () => this.settle(firstOne, newMilestones));
	}

	private settle(firstOne: boolean, newMilestones: number[]): void {
		const kept = this.tiles.filter((t) => t.state !== 'ghost');
		const fresh = spawn(kept, this.rng, this.nextId);
		this.tiles = fresh ? [...kept, { ...fresh, state: 'new' }] : kept;

		if (firstOne) {
			this.reachedOne = true;
			this.phase = 'won';
			haptic('win');
			this.announce = 'Bravo, une pizza entière !';
			this.persist();
			return;
		}
		for (const w of newMilestones) {
			this.milestones.push(w);
			this.showToast(`${w} pizzas entières !`, 'good');
			haptic('win');
		}

		if (!canMove(this.tiles)) {
			this.phase = 'over';
			this.queued = null;
			haptic('gameOver');
			this.announce = `Plus aucun mouvement. Score : ${this.score}.`;
			this.persist();
			return;
		}

		this.phase = 'idle';
		this.persist();
		const next = this.queued;
		this.queued = null;
		if (next) this.move(next);
	}

	continueAfterWin(): void {
		if (this.phase !== 'won') return;
		this.phase = canMove(this.tiles) ? 'idle' : 'over';
		this.persist();
	}

	// -------------------------------------------------------------------------
	// Sélection et simplification
	// -------------------------------------------------------------------------

	tap(id: number | null): void {
		if (this.phase !== 'idle') return;
		if (id === null || id === this.selectedId) {
			this.deselect();
			return;
		}
		const tile = this.tiles.find((t) => t.id === id && t.state !== 'ghost');
		if (!tile) return;
		const choices = divisorChoices(tile.value, this.rng);
		if (choices.length === 0) {
			this.selectedId = null;
			this.shake(tile.id);
			haptic('invalid');
			this.showToast(`${toString(tile.value)} est déjà au plus simple.`, 'info');
			return;
		}
		haptic('tap');
		this.selectedId = tile.id;
		this.choices = choices;
		this.rejected = [];
		this.announce = `${toString(tile.value)} sélectionnée. Choisis un diviseur.`;
	}

	deselect(): void {
		this.selectedId = null;
		this.choices = [];
		this.rejected = [];
	}

	pick(k: number): void {
		const tile = this.selected;
		if (!tile || this.phase !== 'idle') return;
		const outcome = simplifyBy(tile.value, k);

		if (outcome.kind === 'irreducible') {
			this.deselect();
			return;
		}
		if (outcome.kind === 'invalid') {
			this.rejected = [...this.rejected, k];
			this.shake(tile.id);
			haptic('invalid');
			this.showToast(explainInvalid(tile.value, k), 'oops');
			this.announce = explainInvalid(tile.value, k);
			return;
		}

		const id = this.nextId();
		const updated: TileView = {
			id,
			row: tile.row,
			col: tile.col,
			value: outcome.value,
			state: 'simplified',
			divisor: k,
			before: tile.value
		};
		this.tiles = this.tiles.map((t) => (t.id === tile.id ? updated : t));
		this.movesSinceSimplify = 0;

		if (outcome.kind === 'pgcd') {
			const points = simplifyPoints('pgcd', this.combo);
			this.combo++;
			this.addPoints(points, this.combo > 1 ? `Combo x${this.combo}` : 'Au plus simple !');
			haptic('simplifyPgcd');
			this.showToast(
				this.combo > 1
					? `Au plus simple d'un coup ! Combo x${this.combo}`
					: `Au plus simple d'un coup ! ${toString(tile.value)} = ${toString(outcome.value)}`,
				'good'
			);
		} else {
			this.combo = 0;
			this.addPoints(simplifyPoints('partial', 0));
			haptic('simplify');
			this.showToast(`Bien ! ${toString(outcome.value)} peut encore se simplifier.`, 'info');
		}
		this.announce = `${toString(tile.value)} divisé par ${k} donne ${toString(outcome.value)}.`;

		const next = divisorChoices(outcome.value, this.rng);
		if (outcome.kind === 'partial' && next.length > 0) {
			this.selectedId = id;
			this.choices = next;
			this.rejected = [];
		} else {
			this.deselect();
		}
		this.persist();
	}

	// -------------------------------------------------------------------------
	// Aide (appui long)
	// -------------------------------------------------------------------------

	showHelp(id: number): void {
		if (this.tiles.some((t) => t.id === id && t.state !== 'ghost')) {
			this.helpId = id;
			haptic('tap');
		}
	}

	hideHelp(): void {
		this.helpId = null;
	}

	// -------------------------------------------------------------------------
	// Utilitaires
	// -------------------------------------------------------------------------

	/** Deux tuiles équivalentes sont-elles voisines ? (sert à l'aide visuelle éventuelle) */
	hasEquivalentNeighbour(tile: Tile): boolean {
		return this.tiles.some(
			(o) =>
				o.id !== tile.id &&
				o.state !== 'ghost' &&
				Math.abs(o.row - tile.row) + Math.abs(o.col - tile.col) === 1 &&
				isEquivalent(o.value, tile.value)
		);
	}

	private addPoints(points: number, label?: string): void {
		this.score += points;
		this.gain = { id: ++this.eventId, points, label };
		if (this.score > this.best) {
			this.best = this.score;
			save(BEST_KEY, VERSION, this.best);
		}
	}

	private showToast(text: string, tone: Toast['tone']): void {
		const toast = { id: ++this.eventId, text, tone };
		this.toast = toast;
		this.later(FEEL.TOAST_MS, () => {
			if (this.toast?.id === toast.id) this.toast = null;
		});
	}

	private shake(id: number): void {
		this.shakeId = null;
		queueMicrotask(() => (this.shakeId = id));
		this.later(400, () => {
			if (this.shakeId === id) this.shakeId = null;
		});
	}

	private persist(): void {
		const data: SavedGame = {
			tiles: this.tiles
				.filter((t) => t.state !== 'ghost')
				.map(({ id, value, row, col }) => ({ id, value, row, col })),
			score: this.score,
			combo: this.combo,
			movesSinceSimplify: this.movesSinceSimplify,
			reachedOne: this.reachedOne,
			milestones: this.milestones,
			nextId: this.nextIdValue,
			over: this.phase === 'over'
		};
		if (data.over) remove(SAVE_KEY);
		else save(SAVE_KEY, VERSION, data);
	}

	private restore(): boolean {
		const data = load<SavedGame | null>(SAVE_KEY, VERSION, null);
		if (!data || data.over || !Array.isArray(data.tiles) || data.tiles.length === 0) return false;
		this.tiles = data.tiles.map((t) => ({ ...t, state: 'still' }));
		this.score = data.score;
		this.combo = data.combo;
		this.movesSinceSimplify = data.movesSinceSimplify;
		this.reachedOne = data.reachedOne;
		this.milestones = data.milestones ?? [];
		this.nextIdValue = data.nextId;
		this.phase = canMove(this.tiles) ? 'idle' : 'over';
		return true;
	}
}

/** Explique pourquoi k ne permet pas de simplifier, avec les tables de multiplication. */
export function explainInvalid(value: Fraction, k: number): string {
	const n = value.n % k === 0;
	const d = value.d % k === 0;
	if (n && !d) return `${value.n} est dans la table de ${k}, mais pas ${value.d}.`;
	if (!n && d) return `${value.d} est dans la table de ${k}, mais pas ${value.n}.`;
	return `Ni ${value.n} ni ${value.d} ne sont dans la table de ${k}.`;
}
