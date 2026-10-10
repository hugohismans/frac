import { describe, expect, it } from 'vitest';
import {
	canMove,
	comboMultiplier,
	counter,
	divisorChoices,
	emptyCells,
	findVariant,
	formsOf,
	isOne,
	levelOf,
	makeRules,
	mergeCount,
	mergePoints,
	mergeValue,
	move,
	parseFraction,
	simplifyBy,
	simplifyPoints,
	spawn,
	spawnValue,
	validateVariant,
	wholeValue,
	type Rules,
	type Tile
} from './engine';
import { seededRng } from '../rng';
import { G2048, type Variant2048 } from '../settings';
import { isEquivalent, type Fraction } from '../fraction';

const f = (n: number, d: number): Fraction => ({ n, d });

const halves = (size = 4) => makeRules(findVariant('moities'), size);
const thirds = (size = 4) => makeRules(findVariant('tiers'), size);
const twelfths = (size = 4) => makeRules(findVariant('douziemes'), size);

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

/** Une seule ligne de 4 cases, les autres vides. */
function row(...cells: string[]): Tile[] {
	return board([cells, ['.', '.', '.', '.'], ['.', '.', '.', '.'], ['.', '.', '.', '.']]);
}

/** Valeur exacte du plateau, en fraction de l'unité, comparée par produits en croix. */
function total(tiles: Tile[], brick: number): number {
	// Toutes les valeurs sont des multiples de 1/brick : on compte en briques (entier).
	return tiles.reduce((sum, t) => sum + (t.value.n * brick) / t.value.d, 0);
}

describe('parseFraction', () => {
	it('lit les écritures', () => {
		expect(parseFraction('3/12')).toEqual(f(3, 12));
		expect(parseFraction('2')).toEqual(f(2, 1));
	});
});

describe('variantes', () => {
	it('toutes les variantes de settings sont valides', () => {
		for (const v of G2048.VARIANTS) {
			expect(validateVariant(v), v.id).toBeNull();
			expect(G2048.SIZES).toContain(v.defaultSize);
		}
		expect(G2048.VARIANTS.map((v) => v.id)).toContain(G2048.DEFAULT_VARIANT);
	});
	it('refuse une échelle qui ne mène pas à 1', () => {
		const bad: Variant2048 = {
			id: 'x',
			name: 'x',
			description: '',
			brick: 9,
			ladder: [2, 2],
			spawnWeights: [1],
			defaultSize: 4
		};
		expect(validateVariant(bad)).not.toBeNull();
		expect(() => makeRules(bad)).toThrow();
	});
	it('déduit les paliers de la brique et de l’échelle', () => {
		expect(halves().levels).toEqual([f(1, 16), f(1, 8), f(1, 4), f(1, 2), f(1, 1)]);
		expect(thirds().levels).toEqual([f(1, 9), f(1, 3), f(1, 1)]);
		expect(twelfths().levels).toEqual([f(1, 12), f(1, 6), f(1, 3), f(1, 1)]);
		expect(makeRules(findVariant('expert')).levels).toEqual([f(1, 27), f(1, 9), f(1, 3), f(1, 1)]);
	});
	it('garde un plafond au moins égal à la brique', () => {
		expect(halves().maxDen).toBe(G2048.MAX_DENOMINATOR);
		expect(makeRules(findVariant('expert')).maxDen).toBeGreaterThanOrEqual(27);
	});
	it('applique la taille de grille demandée', () => {
		expect(halves(6).size).toBe(6);
		expect(thirds().size).toBe(4);
		expect(makeRules(findVariant('tiers')).size).toBe(findVariant('tiers').defaultSize);
	});
});

describe('levelOf et mergeCount', () => {
	it('trouve le palier quelle que soit l’écriture', () => {
		const r = twelfths();
		expect(levelOf(f(1, 12), r)).toBe(0);
		expect(levelOf(f(2, 12), r)).toBe(1);
		expect(levelOf(f(4, 12), r)).toBe(2);
		expect(levelOf(f(12, 12), r)).toBe(3);
		expect(levelOf(f(3, 1), r)).toBe(4);
		expect(levelOf(f(36, 4), r)).toBe(5);
		expect(levelOf(f(2, 1), r)).toBe(-1);
		expect(levelOf(f(2, 1), halves())).toBe(5);
		expect(levelOf(f(5, 12), r)).toBe(-1);
	});
	it('demande 2 ou 3 tuiles selon le palier', () => {
		const r = twelfths();
		expect(mergeCount(f(1, 12), r)).toBe(2);
		expect(mergeCount(f(1, 6), r)).toBe(2);
		expect(mergeCount(f(4, 12), r)).toBe(3);
		expect(mergeCount(f(1, 1), r)).toBe(3);
		expect(mergeCount(f(8, 8), halves())).toBe(2);
		expect(mergeCount(f(3, 1), thirds())).toBe(3);
		expect(mergeCount(f(1, 9), thirds())).toBe(3);
		expect(mergeCount(f(1, 16), halves())).toBe(2);
	});
});

describe('mergeValue', () => {
	it('additionne sur le dénominateur commun sans simplifier', () => {
		expect(mergeValue([f(1, 4), f(2, 8)])).toEqual(f(4, 8));
		expect(mergeValue([f(2, 8), f(2, 8)])).toEqual(f(4, 8));
		expect(mergeValue([f(4, 8), f(1, 2)])).toEqual(f(8, 8));
		expect(mergeValue([f(3, 12), f(1, 4)])).toEqual(f(6, 12));
		expect(mergeValue([f(8, 8), f(1, 1)])).toEqual(f(16, 8));
	});
	it('fusionne trois tiers en un entier', () => {
		expect(mergeValue([f(1, 3), f(1, 3), f(1, 3)])).toEqual(f(3, 3));
		expect(mergeValue([f(1, 3), f(2, 6), f(1, 3)])).toEqual(f(6, 6));
		expect(mergeValue([f(1, 9), f(1, 9), f(1, 9)])).toEqual(f(3, 9));
	});
	it('garde le plus grand dénominateur quand le commun dépasse le plafond', () => {
		expect(mergeValue([f(3, 12), f(4, 16)])).toEqual(f(8, 16));
		expect(mergeValue([f(4, 16), f(3, 12)])).toEqual(f(8, 16));
		expect(mergeValue([f(12, 12), f(16, 16)])).toEqual(f(32, 16));
		expect(mergeValue([f(3, 12), f(2, 8)])).toEqual(f(6, 12));
		expect(mergeValue([f(3, 12), f(2, 8)], 24)).toEqual(f(12, 24));
		expect(mergeValue([f(1, 3), f(2, 6), f(3, 9)])).toEqual(f(9, 9));
	});
	it('refuse des tuiles non équivalentes ou une tuile seule', () => {
		expect(() => mergeValue([f(1, 4), f(1, 3)])).toThrow();
		expect(() => mergeValue([f(1, 4)])).toThrow();
	});
	it('multiplie toujours la valeur par le nombre de tuiles', () => {
		for (const v of G2048.VARIANTS) {
			const r = makeRules(v);
			for (const level of r.levels.slice(0, -1)) {
				const forms = formsOf(level, r.maxDen);
				for (const a of forms) {
					for (const b of forms) {
						for (const group of [
							[a, b],
							[a, b, a]
						]) {
							const m = mergeValue(group, r.maxDen);
							expect(m.n * a.d).toBe(group.length * a.n * m.d);
							expect(m.d).toBeLessThanOrEqual(r.maxDen);
						}
					}
				}
			}
		}
	});
});

describe('move par paires', () => {
	it('fait glisser sans fusion', () => {
		const r = move(row('.', '1/4', '.', '1/8'), 'left', counter(100), halves());
		expect(r.moved).toBe(true);
		expect(draw(r.tiles)[0]).toEqual(['1/4', '1/8', '.', '.']);
		expect(r.merges).toEqual([]);
	});

	it('fusionne deux tuiles équivalentes et affiche la somme non simplifiée', () => {
		const r = move(row('1/4', '2/8', '.', '.'), 'left', counter(100), halves());
		expect(draw(r.tiles)[0]).toEqual(['4/8', '.', '.', '.']);
		expect(r.merges).toEqual([{ id: 100, from: [1, 2], value: f(4, 8) }]);
		expect(r.ghosts.map((g) => [g.id, g.row, g.col])).toEqual([
			[1, 0, 0],
			[2, 0, 0]
		]);
	});

	it('ne fusionne pas 1/4 et 1/3', () => {
		expect(move(row('1/4', '1/3', '.', '.'), 'left', counter(100), halves()).moved).toBe(false);
	});

	it('ne fusionne chaque tuile qu’une fois par coup', () => {
		const r = move(row('1/8', '1/8', '2/16', '1/8'), 'left', counter(100), halves());
		expect(draw(r.tiles)[0]).toEqual(['2/8', '4/16', '.', '.']);
	});

	it('fusionne vers le bord de destination', () => {
		const r = move(row('1/8', '1/8', '1/8', '.'), 'right', counter(100), halves());
		expect(draw(r.tiles)[0]).toEqual(['.', '.', '1/8', '2/8']);
	});

	it('fonctionne dans les quatre directions', () => {
		const tiles = board([
			['1/2', '.', '.', '.'],
			['.', '.', '.', '.'],
			['.', '.', '.', '.'],
			['2/4', '.', '.', '.']
		]);
		const rules = halves();
		expect(draw(move(tiles, 'up', counter(100), rules).tiles)[0][0]).toBe('4/4');
		expect(draw(move(tiles, 'down', counter(100), rules).tiles)[3][0]).toBe('4/4');
		const right = move(tiles, 'right', counter(100), rules);
		expect(draw(right.tiles)[0][3]).toBe('1/2');
		expect(draw(right.tiles)[3][3]).toBe('2/4');
		expect(move(tiles, 'left', counter(100), rules).moved).toBe(false);
	});

	it('conserve les identifiants des tuiles qui glissent', () => {
		const r = move(row('.', '.', '.', '1/4'), 'left', counter(100), halves());
		expect(r.tiles[0]).toMatchObject({ id: 1, row: 0, col: 0 });
	});
});

describe('move par trois', () => {
	it('deux tiers ne fusionnent pas', () => {
		const r = move(row('1/3', '1/3', '.', '.'), 'left', counter(100), thirds());
		expect(r.moved).toBe(false);
		expect(r.merges).toEqual([]);
	});

	it('trois tiers alignés font un entier', () => {
		const r = move(row('1/3', '2/6', '3/9', '.'), 'left', counter(100), thirds());
		expect(draw(r.tiles)[0]).toEqual(['9/9', '.', '.', '.']);
		expect(r.merges).toEqual([{ id: 100, from: [1, 2, 3], value: f(9, 9) }]);
		expect(r.ghosts).toHaveLength(3);
	});

	it('trois tuiles sur quatre fusionnent, la quatrième glisse', () => {
		const r = move(row('1/9', '1/9', '1/9', '1/9'), 'left', counter(100), thirds());
		expect(draw(r.tiles)[0]).toEqual(['3/9', '1/9', '.', '.']);
	});

	it('fusionne vers le bord de destination', () => {
		const r = move(row('1/9', '1/9', '1/9', '1/9'), 'right', counter(100), thirds());
		expect(draw(r.tiles)[0]).toEqual(['.', '.', '1/9', '3/9']);
	});

	it('trois tuiles séparées par une case vide fusionnent aussi', () => {
		const r = move(row('1/9', '.', '1/9', '1/9'), 'left', counter(100), thirds());
		expect(draw(r.tiles)[0]).toEqual(['3/9', '.', '.', '.']);
	});

	it('après 1, on continue par trois : 1 -> 3', () => {
		expect(move(row('1', '3/3', '.', '.'), 'left', counter(100), thirds()).moved).toBe(false);
		const r = move(row('1', '3/3', '9/9', '.'), 'left', counter(100), thirds());
		expect(draw(r.tiles)[0]).toEqual(['27/9', '.', '.', '.']);
	});

	it('après 1, la variante moitiés continue par paires : 1 -> 2', () => {
		const r = move(row('1', '8/8', '.', '.'), 'left', counter(100), halves());
		expect(draw(r.tiles)[0]).toEqual(['16/8', '.', '.', '.']);
	});

	it('mélange paires et triples dans la variante douzièmes', () => {
		const rules = twelfths();
		expect(draw(move(row('1/12', '1/12', '.', '.'), 'left', counter(100), rules).tiles)[0][0]).toBe(
			'2/12'
		);
		expect(move(row('1/3', '4/12', '.', '.'), 'left', counter(100), rules).moved).toBe(false);
		expect(
			draw(move(row('1/3', '4/12', '2/6', '.'), 'left', counter(100), rules).tiles)[0][0]
		).toBe('12/12');
	});
});

describe('grilles N x N', () => {
	it('déplace et fusionne sur une grille 6 x 6', () => {
		const rules = halves(6);
		const tiles = board([
			['.', '.', '.', '.', '1/4', '1/4'],
			['.', '.', '.', '.', '.', '.'],
			['.', '.', '.', '.', '.', '.'],
			['.', '.', '.', '.', '.', '.'],
			['.', '.', '.', '.', '.', '.'],
			['1/8', '.', '.', '.', '.', '.']
		]);
		const r = move(tiles, 'left', counter(100), rules);
		expect(draw(r.tiles, 6)[0]).toEqual(['2/4', '.', '.', '.', '.', '.']);
		expect(draw(move(tiles, 'right', counter(100), rules).tiles, 6)[5][5]).toBe('1/8');
		expect(emptyCells(r.tiles, 6)).toHaveLength(34);
	});

	it('remplit une grille 3 x 3 sans dépasser', () => {
		const rules = halves(3);
		const rng = seededRng(9);
		const next = counter(1);
		const tiles: Tile[] = [];
		for (let i = 0; i < 9; i++) tiles.push(spawn(tiles, rng, next, rules)!);
		expect(tiles.every((t) => t.row < 3 && t.col < 3)).toBe(true);
		expect(spawn(tiles, rng, next, rules)).toBeNull();
	});

	it('conserve la valeur totale du plateau, quelles que soient la variante et la taille', () => {
		for (const v of G2048.VARIANTS) {
			for (const size of G2048.SIZES) {
				const rules = makeRules(v, size);
				const rng = seededRng(size * 31 + v.brick);
				const next = counter(1);
				let tiles: Tile[] = [];
				for (let i = 0; i < size * 2; i++) tiles.push(spawn(tiles, rng, next, rules)!);
				for (const dir of ['left', 'up', 'right', 'down', 'left', 'down'] as const) {
					const before = total(tiles, v.brick);
					tiles = move(tiles, dir, next, rules).tiles;
					expect(total(tiles, v.brick)).toBe(before);
				}
			}
		}
	});
});

describe('apparitions', () => {
	it('déduit les écritures de la brique', () => {
		expect(formsOf(f(1, 3), 16)).toEqual([f(1, 3), f(2, 6), f(3, 9), f(4, 12), f(5, 15)]);
		expect(formsOf(f(1, 4), 16)).toEqual([f(1, 4), f(2, 8), f(3, 12), f(4, 16)]);
		expect(formsOf(f(2, 8), 16)[0]).toEqual(f(1, 4));
		expect(formsOf(f(1, 27), 16)).toEqual([f(1, 27)]);
	});

	it('ne produit que des paliers de l’échelle', () => {
		for (const v of G2048.VARIANTS) {
			const rules = makeRules(v);
			const rng = seededRng(42);
			const allowed = rules.levels.slice(0, v.spawnWeights.length);
			for (let i = 0; i < 300; i++) {
				const value = spawnValue(rng, rules);
				expect(allowed.some((l) => isEquivalent(l, value))).toBe(true);
				expect(value.d).toBeLessThanOrEqual(rules.maxDen);
			}
		}
	});

	it('produit souvent des formes non simplifiées', () => {
		const rng = seededRng(1);
		const rules = halves();
		let unsimplified = 0;
		for (let i = 0; i < 1000; i++) if (spawnValue(rng, rules).n !== 1) unsimplified++;
		expect(unsimplified).toBeGreaterThan(250);
	});

	it('place la tuile dans une case vide', () => {
		const rules = halves();
		const rng = seededRng(3);
		const next = counter(1);
		const tiles: Tile[] = [];
		for (let i = 0; i < 16; i++) {
			const t = spawn(tiles, rng, next, rules)!;
			expect(tiles.some((o) => o.row === t.row && o.col === t.col)).toBe(false);
			tiles.push(t);
		}
		expect(emptyCells(tiles, 4)).toEqual([]);
		expect(spawn(tiles, rng, next, rules)).toBeNull();
	});
});

describe('canMove', () => {
	const two = (rules: Rules) => ({ ...rules, size: 2 });

	it('vrai tant qu’il reste une case vide', () => {
		expect(
			canMove(
				board([
					['1/2', '.'],
					['1/4', '1/8']
				]),
				two(halves())
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
				two(halves())
			)
		).toBe(true);
		expect(
			canMove(
				board([
					['1/2', '1/4'],
					['2/4', '1/8']
				]),
				two(halves())
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
				two(halves())
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
				two(halves())
			)
		).toBe(false);
	});
	it('par trois : deux tiers voisins ne suffisent pas', () => {
		const rules = { ...thirds(), size: 3 };
		const blocked = board([
			['1/3', '1/3', '1/9'],
			['1/9', '1/9', '1/3'],
			['1/3', '1/9', '1/3']
		]);
		expect(canMove(blocked, rules)).toBe(false);
		const column = board([
			['1/3', '1/9', '1/9'],
			['2/6', '1/9', '1/3'],
			['3/9', '1/3', '1/9']
		]);
		expect(canMove(column, rules)).toBe(true);
	});
});

describe('simplifyBy', () => {
	it('reconnaît la simplification directe par le PGCD', () => {
		expect(simplifyBy(f(4, 8), 4)).toEqual({ kind: 'pgcd', value: f(1, 2), divisor: 4 });
		expect(simplifyBy(f(9, 9), 9)).toEqual({ kind: 'pgcd', value: f(1, 1), divisor: 9 });
	});
	it('accepte une simplification partielle', () => {
		expect(simplifyBy(f(4, 8), 2)).toEqual({ kind: 'partial', value: f(2, 4), divisor: 2 });
		expect(simplifyBy(f(9, 9), 3)).toEqual({ kind: 'partial', value: f(3, 3), divisor: 3 });
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
		const choices = divisorChoices(f(4, 8), seededRng(5), 1, [2, 3, 4, 5]);
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
		expect(mergePoints(f(4, 8))).toBe(G2048.MERGE_POINTS_PER_WHOLE / 2);
		expect(mergePoints(f(8, 8))).toBe(G2048.MERGE_POINTS_PER_WHOLE);
		expect(mergePoints(f(3, 9))).toBe(Math.round(G2048.MERGE_POINTS_PER_WHOLE / 3));
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
