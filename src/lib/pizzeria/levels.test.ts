import { describe, expect, it } from 'vitest';
import { compare, isEquivalent, isIrreducible, pgcd, ppcm } from '../fraction';
import { PIZZERIA } from '../settings';
import { cutWorks, sumOf } from './engine';
import { WORLDS, allLevels, findLevel } from './levels';

const CUTS = PIZZERIA.CUTS as readonly number[];

describe('structure des mondes', () => {
	it('chaque monde a 8 niveaux numérotés de 1 à 8', () => {
		for (const world of WORLDS) {
			expect(world.levels.map((l) => l.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
			for (const l of world.levels) expect(l.world).toBe(world.id);
		}
	});
	it('les quatre mondes sont jouables', () => {
		expect(WORLDS.map((w) => w.id)).toEqual([1, 2, 3, 4]);
		expect(WORLDS.every((w) => !w.comingSoon)).toBe(true);
	});
	it('les identifiants sont uniques', () => {
		const ids = allLevels().map((l) => l.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
	it('chaque niveau compte 3 ou 4 clients (2 à 3 minutes)', () => {
		for (const l of allLevels()) {
			expect(l.customers.length, l.id).toBeGreaterThanOrEqual(3);
			expect(l.customers.length, l.id).toBeLessThanOrEqual(4);
		}
	});
	it('chaque monde ne contient que son type de commande', () => {
		const kinds = { 1: 'parts', 2: 'equivalence', 3: 'simplify', 4: 'addition' } as const;
		for (const l of allLevels()) {
			for (const c of l.customers) expect(c.kind, l.id).toBe(kinds[l.world]);
		}
	});
	it('findLevel retrouve un niveau', () => {
		expect(findLevel(2, 3)?.id).toBe('w2-l3');
		expect(findLevel(2, 9)).toBeUndefined();
	});
});

describe('chaque commande est réalisable', () => {
	for (const level of allLevels()) {
		it(level.id, () => {
			for (const c of level.customers) {
				switch (c.kind) {
					case 'parts': {
						expect(c.order.n).toBeGreaterThan(0);
						expect(c.order.n).toBeLessThan(c.order.d);
						expect(c.cutChoices.every((k) => CUTS.includes(k))).toBe(true);
						expect(c.cutChoices.some((k) => cutWorks(c.order, k))).toBe(true);
						// Le monde 1 parle de parts d'un tout : la découpe de la commande est proposée.
						expect(c.cutChoices).toContain(c.order.d);
						break;
					}
					case 'equivalence': {
						expect(CUTS).toContain(c.imposedCut);
						expect(cutWorks(c.order, c.imposedCut)).toBe(true);
						// La découpe est différente de la commande : c'est tout l'intérêt du monde.
						expect(c.imposedCut).not.toBe(c.order.d);
						break;
					}
					case 'simplify': {
						expect(CUTS).toContain(c.tray.d);
						expect(c.tray.n).toBeGreaterThan(0);
						expect(c.tray.n).toBeLessThanOrEqual(c.tray.d);
						expect(isIrreducible(c.tray)).toBe(false);
						// On doit pouvoir atteindre l'irréductible avec les boutons proposés.
						let n = c.tray.n;
						let d = c.tray.d;
						let guard = 10;
						while (pgcd(n, d) > 1 && guard-- > 0) {
							const k = (PIZZERIA.REGROUP_CHOICES as readonly number[]).find(
								(k) => n % k === 0 && d % k === 0
							);
							expect(k, `${c.tray.n}/${c.tray.d}`).toBeDefined();
							n /= k!;
							d /= k!;
						}
						expect(pgcd(n, d)).toBe(1);
						break;
					}
					case 'addition': {
						const all = c.leftovers;
						expect(all.length).toBeGreaterThanOrEqual(2);
						expect(all.length).toBeLessThanOrEqual(3);
						for (const p of all) {
							expect(CUTS).toContain(p.d);
							expect(p.n).toBeGreaterThan(0);
						}
						// Tous les restes tiennent dans une pizza : le plateau ne déborde jamais.
						expect(compare(sumOf(all), { n: 1, d: 1 })).toBeLessThanOrEqual(0);
						// Une découpe commune existe pour tous les restes.
						const common = all.reduce((m, p) => ppcm(m, p.d), 1);
						expect(CUTS, `ppcm ${common}`).toContain(common);
						// Au moins une combinaison d'au moins deux restes donne la commande,
						// et aucun reste seul ne suffit.
						const subsets = Array.from({ length: 2 ** all.length }, (_, mask) =>
							all.filter((_, i) => mask & (1 << i))
						);
						expect(subsets.some((s) => s.length >= 2 && isEquivalent(sumOf(s), c.order))).toBe(
							true
						);
						expect(all.some((p) => isEquivalent(p, c.order))).toBe(false);
						break;
					}
				}
			}
		});
	}
});
