/**
 * Règles de Fraction 2048, sans DOM ni état global : tout est pur et testable.
 *
 * Une variante est définie par une brique 1/n et une échelle : à chaque palier, il faut
 * réunir k tuiles égales (2 ou 3) pour passer au palier suivant, jusqu'à 1.
 * Brique 1/16, échelle [2, 2, 2, 2] : 1/16 -> 1/8 -> 1/4 -> 1/2 -> 1.
 * Brique 1/9, échelle [3, 3] : 1/9 -> 1/3 -> 1.
 * Après 1, on continue avec le dernier facteur : 1 -> 2 -> 4 (par paires) ou 1 -> 3 -> 9 (par trois).
 */

import {
	canDivideBy,
	commonDivisors,
	divideBy,
	frac,
	isEquivalent,
	pgcd,
	ppcm,
	simplify,
	type Fraction
} from '../fraction';
import { G2048, type Variant2048 } from '../settings';
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
	from: number[];
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

/** Tout ce qu'il faut pour jouer une variante sur une grille donnée. */
export interface Rules {
	variantId: string;
	size: number;
	/** Plafond des dénominateurs (fusions et apparitions). */
	maxDen: number;
	/** Paliers irréductibles de la brique jusqu'à 1 inclus. */
	levels: Fraction[];
	/** Nombre de tuiles à réunir pour quitter chaque palier (même longueur que levels - 1). */
	ladder: number[];
	/** Nombre de tuiles à réunir au-delà de 1. */
	afterOne: number;
	spawnWeights: number[];
}

export function counter(start = 1): IdGen {
	let id = start;
	return () => id++;
}

export function findVariant(id: string): Variant2048 {
	return G2048.VARIANTS.find((v) => v.id === id) ?? G2048.VARIANTS[0];
}

/** Vérifie qu'une variante mène bien à 1. */
export function validateVariant(v: Variant2048): string | null {
	if (v.ladder.length === 0) return 'Échelle vide';
	if (v.afterOne !== undefined && (!Number.isInteger(v.afterOne) || v.afterOne < 2)) {
		return 'Après 1, il faut réunir au moins 2 tuiles';
	}
	if (v.ladder.some((k) => !Number.isInteger(k) || k < 2))
		return 'Chaque palier doit réunir au moins 2 tuiles';
	const product = v.ladder.reduce((a, b) => a * b, 1);
	if (product !== v.brick) return `Le produit de l'échelle (${product}) doit valoir ${v.brick}`;
	if (v.spawnWeights.length === 0 || v.spawnWeights.length > v.ladder.length) {
		return 'Les poids d’apparition doivent porter sur des paliers avant 1';
	}
	return null;
}

export function makeRules(variant: Variant2048, size: number = variant.defaultSize): Rules {
	const error = validateVariant(variant);
	if (error) throw new Error(`Variante ${variant.id} invalide : ${error}`);
	const levels: Fraction[] = [frac(1, variant.brick)];
	for (const k of variant.ladder) {
		const last = levels[levels.length - 1];
		levels.push(simplify({ n: last.n * k, d: last.d }));
	}
	return {
		variantId: variant.id,
		size,
		maxDen: Math.max(variant.maxDenominator ?? G2048.MAX_DENOMINATOR, variant.brick),
		levels,
		ladder: [...variant.ladder],
		afterOne: variant.afterOne ?? variant.ladder[variant.ladder.length - 1],
		spawnWeights: [...variant.spawnWeights]
	};
}

/** "3/12" donne {n: 3, d: 12}. */
export function parseFraction(text: string): Fraction {
	const [n, d = '1'] = text.split('/');
	return frac(Number(n), Number(d));
}

/**
 * Index du palier d'une valeur (0 = la brique), ou -1 si elle n'est pas sur l'échelle.
 * Au-delà de 1, chaque multiplication par `afterOne` monte d'un palier.
 */
export function levelOf(value: Fraction, rules: Rules): number {
	const i = rules.levels.findIndex((l) => isEquivalent(l, value));
	if (i >= 0) return i;
	let whole = value.n % value.d === 0 ? value.n / value.d : 0;
	let level = rules.levels.length - 1;
	while (whole > 1 && whole % rules.afterOne === 0) {
		whole /= rules.afterOne;
		level++;
	}
	return whole === 1 ? level : -1;
}

/** Nombre de tuiles égales à réunir pour fusionner cette valeur. */
export function mergeCount(value: Fraction, rules: Rules): number {
	const level = levelOf(value, rules);
	if (level >= 0 && level < rules.ladder.length) return rules.ladder[level];
	return rules.afterOne;
}

/**
 * Résultat d'une fusion de tuiles équivalentes : leur somme sur le plus petit dénominateur
 * commun, non simplifiée. Si ce dénominateur dépasse le plafond, on écrit la somme sur le plus
 * grand des dénominateurs présents.
 */
export function mergeValue(
	values: readonly Fraction[],
	maxDen: number = G2048.MAX_DENOMINATOR
): Fraction {
	if (values.length < 2) throw new Error('Il faut au moins deux tuiles pour fusionner');
	if (values.some((v) => !isEquivalent(v, values[0]))) {
		throw new Error('Seules des tuiles équivalentes fusionnent');
	}
	const k = values.length;
	const common = values.reduce((d, v) => ppcm(d, v.d), 1);
	if (common <= maxDen) {
		return { n: values.reduce((sum, v) => sum + v.n * (common / v.d), 0), d: common };
	}
	const big = values.reduce((a, b) => (b.d > a.d ? b : a));
	return { n: big.n * k, d: big.d };
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

/** Longueur du groupe de tuiles équivalentes qui commence à l'index j (0 si pas de fusion). */
function groupAt(line: readonly Tile[], j: number, rules: Rules): number {
	const k = mergeCount(line[j].value, rules);
	if (j + k > line.length) return 0;
	for (let i = 1; i < k; i++) {
		if (!isEquivalent(line[j].value, line[j + i].value)) return 0;
	}
	return k;
}

/**
 * Joue un coup. Chaque tuile ne fusionne qu'une fois par coup, comme dans le 2048 classique.
 * Une fusion réunit exactement le nombre de tuiles demandé par le palier (2 ou 3).
 */
export function move(
	tiles: readonly Tile[],
	dir: Direction,
	nextId: IdGen,
	rules: Rules
): MoveResult {
	const { size } = rules;
	const g = grid(tiles, size);
	const out: Tile[] = [];
	const ghosts: Tile[] = [];
	const merges: Merge[] = [];
	let moved = false;

	for (let line = 0; line < size; line++) {
		const positions = linePositions(dir, line, size);
		const lineTiles = positions.map((p) => g[p.row][p.col]).filter((t): t is Tile => !!t);
		let slot = 0;
		let j = 0;
		while (j < lineTiles.length) {
			const dest = positions[slot++];
			const k = groupAt(lineTiles, j, rules);
			if (k > 0) {
				const group = lineTiles.slice(j, j + k);
				const merged: Tile = {
					id: nextId(),
					value: mergeValue(
						group.map((t) => t.value),
						rules.maxDen
					),
					...dest
				};
				ghosts.push(...group.map((t) => ({ ...t, ...dest })));
				merges.push({ id: merged.id, from: group.map((t) => t.id), value: merged.value });
				out.push(merged);
				moved = true;
				j += k;
			} else {
				const a = lineTiles[j];
				if (a.row !== dest.row || a.col !== dest.col) moved = true;
				out.push({ ...a, ...dest });
				j++;
			}
		}
	}

	return moved
		? { tiles: out, ghosts, merges, moved }
		: { tiles: [...tiles], ghosts: [], merges: [], moved };
}

export function emptyCells(tiles: readonly Tile[], size: number): { row: number; col: number }[] {
	const g = grid(tiles, size);
	const cells: { row: number; col: number }[] = [];
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			if (!g[row][col]) cells.push({ row, col });
		}
	}
	return cells;
}

/**
 * Écritures possibles d'une valeur : l'irréductible, puis ses amplifications tant que le
 * dénominateur reste sous le plafond. 1/3 avec un plafond de 16 : 1/3, 2/6, 3/9, 4/12, 5/15.
 */
export function formsOf(value: Fraction, maxDen: number): Fraction[] {
	const base = simplify(value);
	const forms: Fraction[] = [];
	for (let a = 1; base.d * a <= maxDen; a++) forms.push({ n: base.n * a, d: base.d * a });
	return forms.length > 0 ? forms : [base];
}

/** Tire la valeur et l'écriture d'une nouvelle tuile. */
export function spawnValue(rng: Rng, rules: Rules): Fraction {
	const weighted = rules.spawnWeights.map((weight, level) => ({ weight, level }));
	const { level } = pickWeighted(rng, weighted);
	const [simplest, ...others] = formsOf(rules.levels[level], rules.maxDen);
	return others.length > 0 && rng() < G2048.SPAWN_UNSIMPLIFIED_P ? pick(rng, others) : simplest;
}

/** Ajoute une tuile dans une case vide au hasard. Renvoie null si la grille est pleine. */
export function spawn(tiles: readonly Tile[], rng: Rng, nextId: IdGen, rules: Rules): Tile | null {
	const cells = emptyCells(tiles, rules.size);
	if (cells.length === 0) return null;
	const cell = cells[randomInt(rng, cells.length)];
	return { id: nextId(), value: spawnValue(rng, rules), ...cell };
}

/** Faux si la grille est pleine et qu'aucun groupe de tuiles voisines ne peut fusionner. */
export function canMove(tiles: readonly Tile[], rules: Rules): boolean {
	const { size } = rules;
	if (tiles.length < size * size) return true;
	const g = grid(tiles, size);
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			const t = g[row][col]!;
			const k = mergeCount(t.value, rules);
			let horizontal = col + k <= size;
			let vertical = row + k <= size;
			for (let i = 1; i < k; i++) {
				if (horizontal && !isEquivalent(t.value, g[row][col + i]!.value)) horizontal = false;
				if (vertical && !isEquivalent(t.value, g[row + i][col]!.value)) vertical = false;
			}
			if (horizontal || vertical) return true;
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
	const remaining = pool.filter((k) => k > 1 && !canDivideBy(value, k));
	const chosen: number[] = [];
	while (chosen.length < distractors && remaining.length > 0) {
		chosen.push(...remaining.splice(randomInt(rng, remaining.length), 1));
	}
	return [...valid, ...chosen].sort((a, b) => a - b);
}

/** Multiplicateur de combo pour une valeur de combo donnée. */
export function comboMultiplier(combo: number): number {
	return Math.min(G2048.COMBO_MAX_MULT, 1 + G2048.COMBO_STEP * combo);
}

/** Points d'une fusion, proportionnels à la valeur obtenue. */
export function mergePoints(value: Fraction): number {
	return Math.round((value.n * G2048.MERGE_POINTS_PER_WHOLE) / value.d);
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
