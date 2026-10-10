import { describe, expect, it } from 'vitest';
import {
	canMove,
	comboMultiplier,
	counter,
	divisorChoices,
	emptyCells,
	isOne,
	mergePoints,
	mergeValue,
	move,
	parseFraction,
	simplifyBy,
	simplifyPoints,
	sixteenths,
	spawn,
	spawnValue,
	wholeValue,
	type Tile
} from './engine';
import { seededRng } from '../rng';
import { G2048 } from '../settings';
import type { Fraction } from '../fraction';

const f = (n: number, d: number): Fraction => ({ n, d });

/** Construit une grille à partir d'un dessin : "1/4" ou "." par case. */
function board(rows: string[][]): Tile[] {
	let id = 1;
	const tiles: Tile[] = [];
	rows.forEach((cells, row) =>
		cells.forEach((cell, col) => {
			if (cell !== '.') tiles.push({ id: id++, value: parseFraction(cell), row, col });
		})
	);
	return tiles;
}

/** Redessine une grille pour comparer facilement. */
function draw(tiles: Tile[], size = 4): string[][] {
	const out = Array.from({ length: size }, () => Array(size).fill('.'));
	for (const t of tiles)
		out[t.row][t.col] = t.value.d === 1 ? `${t.value.n}` : `${t.value.n}/${t.value.d}`;
	return out;
}

describe('parseFraction', () => {
	it('lit les écritures', () => {
		expect(parseFraction('3/12')).toEqual(f(3, 12));
		expect(parseFraction('2')).toEqual(f(2, 1));
	});
});

describe('mergeValue', () => {
	it('additionne sur le dénominateur commun sans simplifier', () => {
		expect(mergeValue(f(1, 4), f(2, 8))).toEqual(f(4, 8));
		expect(mergeValue(f(2, 8), f(2, 8))).toEqual(f(4, 8));
		expect(mergeValue(f(4, 8), f(1, 2))).toEqual(f(8, 8));
		expect(mergeValue(f(3, 12), f(1, 4))).toEqual(f(6, 12));
		expect(mergeValue(f(8, 8), f(1, 1))).toEqual(f(16, 8));
	});
	it('garde le plus grand dénominateur quand le commun dépasse le plafond', () => {
		expect(mergeValue(f(3, 12), f(4, 16))).toEqual(f(8, 16));
		expect(mergeValue(f(4, 16), f(3, 12))).toEqual(f(8, 16));
		expect(mergeValue(f(12, 12), f(16, 16))).toEqual(f(32, 16));
		expect(mergeValue(f(3, 12), f(2, 8))).toEqual(f(6, 12));
		expect(mergeValue(f(3, 12), f(2, 8), 24)).toEqual(f(12, 24));
	});
	it('refuse deux tuiles non équivalentes', () => {
		expect(() => mergeValue(f(1, 4), f(1, 3))).toThrow();
	});
	it('double toujours la valeur', () => {
		const forms = Object.values(G2048.SPAWN_FORMS).flat().map(parseFraction);
		for (const a of forms) {
			for (const b of forms) {
				if (a.n * b.d !== b.n * a.d) continue;
				const m = mergeValue(a, b);
				expect(m.n * a.d).toBe(2 * a.n * m.d);
				expect(m.d).toBeLessThanOrEqual(G2048.MAX_DENOMINATOR);
			}
		}
	});
});

describe('move', () => {
	it('fait glisser sans fusion', () => {
		const tiles = board([
			['.', '1/4', '.', '1/8'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.']
		]);
		const r = move(tiles, 'left', counter(100));
		expect(r.moved).toBe(true);
		expect(draw(r.tiles)[0]).toEqual(['1/4', '1/8', '.', '.']);
		expect(r.merges).toEqual([]);
	});

	it('fusionne deux tuiles équivalentes et affiche la somme non simplifiée', () => {
		const tiles = board([
			['1/4', '2/8', '.', '.'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.']
		]);
		const r = move(tiles, 'left', counter(100));
		expect(draw(r.tiles)[0]).toEqual(['4/8', '.', '.', '.']);
		expect(r.merges).toEqual([{ id: 100, from: [1, 2], value: f(4, 8) }]);
		expect(r.ghosts.map((g) => [g.id, g.row, g.col])).toEqual([
			[1, 0, 0],
			[2, 0, 0]
		]);
	});

	it('ne fusionne pas 1/4 et 1/3', () => {
		const tiles = board([
			['1/4', '1/3', '.', '.'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.']
		]);
		const r = move(tiles, 'left', counter(100));
		expect(r.moved).toBe(false);
	});

	it('ne fusionne chaque tuile qu’une fois par coup', () => {
		const tiles = board([
			['1/8', '1/8', '2/16', '1/8'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.']
		]);
		const r = move(tiles, 'left', counter(100));
		expect(draw(r.tiles)[0]).toEqual(['2/8', '4/16', '.', '.']);
	});

	it('fusionne vers le bord de destination', () => {
		const tiles = board([
			['1/8', '1/8', '1/8', '.'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.']
		]);
		const r = move(tiles, 'right', counter(100));
		expect(draw(r.tiles)[0]).toEqual(['.', '.', '1/8', '2/8']);
	});

	it('fonctionne dans les quatre directions', () => {
		const tiles = board([
			['1/2', '.', '.', '.'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.'],
			['2/4', '.', '.', '.']
		]);
		expect(draw(move(tiles, 'up', counter(100)).tiles)[0][0]).toBe('4/4');
		expect(draw(move(tiles, 'down', counter(100)).tiles)[3][0]).toBe('4/4');
		const right = move(tiles, 'right', counter(100));
		expect(draw(right.tiles)[0][3]).toBe('1/2');
		expect(draw(right.tiles)[3][3]).toBe('2/4');
		expect(move(tiles, 'left', counter(100)).moved).toBe(false);
	});

	it('conserve les identifiants des tuiles qui glissent', () => {
		const tiles = board([
			['.', '.', '.', '1/4'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.']
		]);
		const r = move(tiles, 'left', counter(100));
		expect(r.tiles[0]).toMatchObject({ id: 1, row: 0, col: 0 });
	});

	it('conserve la valeur totale du plateau', () => {
		const rng = seededRng(7);
		const next = counter(1);
		let tiles: Tile[] = [];
		for (let i = 0; i < 6; i++) tiles.push(spawn(tiles, rng, next)!);
		const total = (ts: Tile[]) => ts.reduce((s, t) => s + sixteenths(t.value), 0);
		for (const dir of ['left', 'up', 'right', 'down', 'left'] as const) {
			const before = total(tiles);
			tiles = move(tiles, dir, next).tiles;
			expect(total(tiles)).toBe(before);
		}
	});
});

describe('spawn', () => {
	it('ne produit que des valeurs de la forme 2^k/16', () => {
		const rng = seededRng(42);
		for (let i = 0; i < 500; i++) {
			const v = spawnValue(rng);
			const s = sixteenths(v);
			expect(Number.isInteger(s)).toBe(true);
			expect([1, 2, 4, 8]).toContain(s);
			expect(v.d).toBeLessThanOrEqual(G2048.MAX_DENOMINATOR);
		}
	});
	it('produit souvent des formes non simplifiées', () => {
		const rng = seededRng(1);
		let unsimplified = 0;
		for (let i = 0; i < 1000; i++) {
			const v = spawnValue(rng);
			if (v.n !== 1) unsimplified++;
		}
		expect(unsimplified).toBeGreaterThan(250);
	});
	it('place la tuile dans une case vide', () => {
		const rng = seededRng(3);
		const next = counter(1);
		const tiles: Tile[] = [];
		for (let i = 0; i < 16; i++) {
			const t = spawn(tiles, rng, next)!;
			expect(tiles.some((o) => o.row === t.row && o.col === t.col)).toBe(false);
			tiles.push(t);
		}
		expect(emptyCells(tiles)).toEqual([]);
		expect(spawn(tiles, rng, next)).toBeNull();
	});
});

describe('canMove', () => {
	it('vrai tant qu’il reste une case vide', () => {
		expect(
			canMove(
				board([
					['1/2', '.'],
					['1/4', '1/8']
				]),
				2
			)
		).toBe(true);
	});
	it('vrai si deux voisines sont équivalentes, même écrites différemment', () => {
		expect(
			canMove(
				board([
					['1/2', '1/4'],
					['1/8', '2/16']
				]),
				2
			)
		).toBe(true);
		expect(
			canMove(
				board([
					['1/2', '1/4'],
					['2/4', '1/8']
				]),
				2
			)
		).toBe(true);
	});
	it('faux quand tout est bloqué', () => {
		expect(
			canMove(
				board([
					['1/2', '1/4'],
					['1/8', '1/2']
				]),
				2
			)
		).toBe(false);
	});
	it('ignore les équivalences en diagonale', () => {
		expect(
			canMove(
				board([
					['1/2', '1/4'],
					['2/8', '4/8']
				]),
				2
			)
		).toBe(false);
	});
});

describe('simplifyBy', () => {
	it('reconnaît la simplification directe par le PGCD', () => {
		expect(simplifyBy(f(4, 8), 4)).toEqual({ kind: 'pgcd', value: f(1, 2), divisor: 4 });
		expect(simplifyBy(f(8, 8), 8)).toEqual({ kind: 'pgcd', value: f(1, 1), divisor: 8 });
	});
	it('accepte une simplification partielle', () => {
		expect(simplifyBy(f(4, 8), 2)).toEqual({ kind: 'partial', value: f(2, 4), divisor: 2 });
	});
	it('refuse un diviseur qui ne divise pas les deux nombres', () => {
		expect(simplifyBy(f(6, 8), 3)).toEqual({ kind: 'invalid', divisor: 3 });
		expect(simplifyBy(f(6, 8), 1)).toEqual({ kind: 'invalid', divisor: 1 });
	});
	it('signale une fraction déjà irréductible', () => {
		expect(simplifyBy(f(3, 4), 2)).toEqual({ kind: 'irreducible' });
	});
});

describe('divisorChoices', () => {
	it('propose les diviseurs communs et des faux diviseurs, triés', () => {
		const rng = seededRng(5);
		const choices = divisorChoices(f(4, 8), rng, 1, [2, 3, 4, 5]);
		expect(choices).toContain(2);
		expect(choices).toContain(4);
		expect(choices).toHaveLength(3);
		expect([...choices].sort((a, b) => a - b)).toEqual(choices);
		const wrong = choices.filter((k) => k !== 2 && k !== 4);
		expect([3, 5]).toContain(wrong[0]);
	});
	it('ne propose rien pour une fraction irréductible', () => {
		expect(divisorChoices(f(3, 4), seededRng(1))).toEqual([]);
	});
	it('sans faux diviseur, ne propose que les diviseurs communs', () => {
		expect(divisorChoices(f(8, 16), seededRng(1), 0)).toEqual([2, 4, 8]);
	});
});

describe('points', () => {
	it('récompense une fusion selon la valeur obtenue', () => {
		expect(mergePoints(f(4, 8))).toBe(8 * G2048.MERGE_POINTS_PER_SIXTEENTH);
		expect(mergePoints(f(8, 8))).toBe(16 * G2048.MERGE_POINTS_PER_SIXTEENTH);
	});
	it('applique le combo aux simplifications par le PGCD', () => {
		expect(simplifyPoints('pgcd', 0)).toBe(G2048.SIMPLIFY_PGCD_POINTS);
		expect(simplifyPoints('pgcd', 2)).toBe(
			Math.round(G2048.SIMPLIFY_PGCD_POINTS * comboMultiplier(2))
		);
		expect(simplifyPoints('partial', 5)).toBe(G2048.SIMPLIFY_PARTIAL_POINTS);
	});
	it('plafonne le multiplicateur', () => {
		expect(comboMultiplier(1000)).toBe(G2048.COMBO_MAX_MULT);
	});
});

describe('entiers', () => {
	it('reconnaît 1 sous toutes ses formes', () => {
		expect(isOne(f(8, 8))).toBe(true);
		expect(isOne(f(1, 1))).toBe(true);
		expect(isOne(f(7, 8))).toBe(false);
		expect(wholeValue(f(16, 8))).toBe(2);
		expect(wholeValue(f(6, 8))).toBeNull();
	});
});
