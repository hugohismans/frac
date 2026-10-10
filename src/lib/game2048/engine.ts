/**
 * Règles de Fraction 2048, sans DOM ni état global : tout est pur et testable.
 */

import {
	add,
	canDivideBy,
	commonDivisors,
	divideBy,
	expressOver,
	frac,
	isEquivalent,
	pgcd,
	ppcm,
	type Fraction
} from '../fraction';
import { G2048 } from '../settings';
import { pick, pickWeighted, randomInt, type Rng } from '../rng';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Tile {
	id: number;
	value: Fraction;
	row: number;
	col: number;
}

export interface Merge {
	/** Identifiant de la nouvelle tuile issue de la fusion. */
	id: number;
	from: [number, number];
	value: Fraction;
}

export interface MoveResult {
	tiles: Tile[];
	/** Tuiles sources d'une fusion, placées sur la case d'arrivée (pour l'animation). */
	ghosts: Tile[];
	merges: Merge[];
	moved: boolean;
}

export type IdGen = () => number;

export function counter(start = 1): IdGen {
	let id = start;
	return () => id++;
}

/** "3/12" donne {n: 3, d: 12}. */
export function parseFraction(text: string): Fraction {
	const [n, d = '1'] = text.split('/');
	return frac(Number(n), Number(d));
}

/** Valeur exprimée en seizièmes. Toutes les tuiles du jeu valent un nombre entier de seizièmes. */
export function sixteenths(f: Fraction): number {
	return (f.n * 16) / f.d;
}

/**
 * Résultat d'une fusion de deux tuiles équivalentes : leur somme sur le plus petit
 * dénominateur commun, non simplifiée. Si ce dénominateur dépasse le plafond,
 * on écrit la somme sur le plus grand des deux dénominateurs.
 */
export function mergeValue(
	a: Fraction,
	b: Fraction,
	maxDen: number = G2048.MAX_DENOMINATOR
): Fraction {
	if (!isEquivalent(a, b)) throw new Error('Seules deux tuiles équivalentes fusionnent');
	if (ppcm(a.d, b.d) <= maxDen) return add(a, b);
	const big = a.d >= b.d ? a : b;
	return { n: big.n * 2, d: big.d };
}

function linePositions(dir: Direction, line: number, size: number): { row: number; col: number }[] {
	const positions: { row: number; col: number }[] = [];
	for (let k = 0; k < size; k++) {
		const far = size - 1 - k;
		switch (dir) {
			case 'left':
				positions.push({ row: line, col: k });
				break;
			case 'right':
				positions.push({ row: line, col: far });
				break;
			case 'up':
				positions.push({ row: k, col: line });
				break;
			case 'down':
				positions.push({ row: far, col: line });
				break;
		}
	}
	return positions;
}

function grid(tiles: readonly Tile[], size: number): (Tile | undefined)[][] {
	const g: (Tile | undefined)[][] = Array.from({ length: size }, () => Array(size).fill(undefined));
	for (const t of tiles) g[t.row][t.col] = t;
	return g;
}

/** Joue un coup. Chaque tuile ne fusionne qu'une fois par coup, comme dans le 2048 classique. */
export function move(
	tiles: readonly Tile[],
	dir: Direction,
	nextId: IdGen,
	size: number = G2048.SIZE,
	maxDen: number = G2048.MAX_DENOMINATOR
): MoveResult {
	const g = grid(tiles, size);
	const out: Tile[] = [];
	const ghosts: Tile[] = [];
	const merges: Merge[] = [];
	let moved = false;

	for (let line = 0; line < size; line++) {
		const positions = linePositions(dir, line, size);
		const lineTiles = positions.map((p) => g[p.row][p.col]).filter((t): t is Tile => !!t);
		let slot = 0;
		for (let j = 0; j < lineTiles.length; j++) {
			const a = lineTiles[j];
			const b = lineTiles[j + 1];
			const dest = positions[slot++];
			if (b && isEquivalent(a.value, b.value)) {
				const merged: Tile = { id: nextId(), value: mergeValue(a.value, b.value, maxDen), ...dest };
				ghosts.push({ ...a, ...dest }, { ...b, ...dest });
				merges.push({ id: merged.id, from: [a.id, b.id], value: merged.value });
				out.push(merged);
				moved = true;
				j++;
			} else {
				if (a.row !== dest.row || a.col !== dest.col) moved = true;
				out.push({ ...a, ...dest });
			}
		}
	}

	return moved
		? { tiles: out, ghosts, merges, moved }
		: { tiles: [...tiles], ghosts: [], merges: [], moved };
}

export function emptyCells(
	tiles: readonly Tile[],
	size: number = G2048.SIZE
): { row: number; col: number }[] {
	const g = grid(tiles, size);
	const cells: { row: number; col: number }[] = [];
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			if (!g[row][col]) cells.push({ row, col });
		}
	}
	return cells;
}

/** Tire la valeur et l'écriture d'une nouvelle tuile. */
export function spawnValue(rng: Rng): Fraction {
	const { sixteenths: value } = pickWeighted(rng, G2048.SPAWN_VALUE_WEIGHTS);
	const forms = G2048.SPAWN_FORMS[value] ?? [`${value}/16`];
	const [simplest, ...others] = forms;
	const text =
		others.length > 0 && rng() < G2048.SPAWN_UNSIMPLIFIED_P ? pick(rng, others) : simplest;
	return parseFraction(text);
}

/** Ajoute une tuile dans une case vide au hasard. Renvoie null si la grille est pleine. */
export function spawn(
	tiles: readonly Tile[],
	rng: Rng,
	nextId: IdGen,
	size: number = G2048.SIZE
): Tile | null {
	const cells = emptyCells(tiles, size);
	if (cells.length === 0) return null;
	const cell = cells[randomInt(rng, cells.length)];
	return { id: nextId(), value: spawnValue(rng), ...cell };
}

/** Faux si la grille est pleine et qu'aucune paire voisine n'est équivalente. */
export function canMove(tiles: readonly Tile[], size: number = G2048.SIZE): boolean {
	if (tiles.length < size * size) return true;
	const g = grid(tiles, size);
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			const t = g[row][col]!;
			const right = col + 1 < size ? g[row][col + 1] : undefined;
			const down = row + 1 < size ? g[row + 1][col] : undefined;
			if (right && isEquivalent(t.value, right.value)) return true;
			if (down && isEquivalent(t.value, down.value)) return true;
		}
	}
	return false;
}

export type SimplifyOutcome =
	| { kind: 'pgcd'; value: Fraction; divisor: number }
	| { kind: 'partial'; value: Fraction; divisor: number }
	| { kind: 'invalid'; divisor: number }
	| { kind: 'irreducible' };

/** Essaie de diviser une tuile par k. */
export function simplifyBy(value: Fraction, k: number): SimplifyOutcome {
	const g = pgcd(value.n, value.d);
	if (g === 1) return { kind: 'irreducible' };
	if (k <= 1 || !canDivideBy(value, k)) return { kind: 'invalid', divisor: k };
	return { kind: k === g ? 'pgcd' : 'partial', value: divideBy(value, k), divisor: k };
}

/**
 * Diviseurs proposés pour une tuile : tous les diviseurs communs, plus quelques faux
 * diviseurs tirés du réservoir, le tout trié par ordre croissant.
 */
export function divisorChoices(
	value: Fraction,
	rng: Rng,
	distractors: number = G2048.DIVISOR_DISTRACTORS,
	pool: readonly number[] = G2048.DIVISOR_DISTRACTOR_POOL
): number[] {
	const valid = commonDivisors(value);
	if (valid.length === 0) return [];
	const wrong = pool.filter((k) => k > 1 && !canDivideBy(value, k));
	const chosen: number[] = [];
	const remaining = [...wrong];
	while (chosen.length < distractors && remaining.length > 0) {
		chosen.push(...remaining.splice(randomInt(rng, remaining.length), 1));
	}
	return [...valid, ...chosen].sort((a, b) => a - b);
}

/** Multiplicateur de combo pour une valeur de combo donnée. */
export function comboMultiplier(combo: number): number {
	return Math.min(G2048.COMBO_MAX_MULT, 1 + G2048.COMBO_STEP * combo);
}

/** Points d'une fusion. */
export function mergePoints(value: Fraction): number {
	return sixteenths(value) * G2048.MERGE_POINTS_PER_SIXTEENTH;
}

/** Points d'une simplification réussie, combo en cours compris. */
export function simplifyPoints(kind: 'pgcd' | 'partial', combo: number): number {
	if (kind === 'partial') return G2048.SIMPLIFY_PARTIAL_POINTS;
	return Math.round(G2048.SIMPLIFY_PGCD_POINTS * comboMultiplier(combo));
}

/** Vrai si la valeur est exactement 1 (quelle que soit l'écriture : 8/8, 16/16, 1). */
export function isOne(f: Fraction): boolean {
	return f.n === f.d;
}

/** Valeur entière atteinte par une tuile, ou null si ce n'est pas un entier. */
export function wholeValue(f: Fraction): number | null {
	return f.n % f.d === 0 ? f.n / f.d : null;
}
