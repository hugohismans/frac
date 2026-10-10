import { describe, expect, it } from 'vitest';
import { isIrreducible, pgcd } from '../fraction';
import { PIZZERIA } from '../settings';
import { cutWorks } from './engine';
import { WORLDS, allLevels, findLevel } from './levels';

const CUTS = PIZZERIA.CUTS as readonly number[];

describe('structure des mondes', () => {
	it('les mondes 1 à 3 ont 8 niveaux numérotés de 1 à 8', () => {
		for (const world of WORLDS.filter((w) => !w.comingSoon)) {
			expect(world.levels.map((l) => l.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
			for (const l of world.levels) expect(l.world).toBe(world.id);
		}
	});
	it('le monde 4 (addition) est annoncé mais pas encore jouable', () => {
		const w4 = WORLDS.find((w) => w.id === 4)!;
		expect(w4.comingSoon).toBe(true);
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
		const kinds = { 1: 'parts', 2: 'equivalence', 3: 'simplify' } as const;
		for (const l of allLevels()) {
			for (const c of l.customers) expect(c.kind, l.id).toBe(kinds[l.world as 1 | 2 | 3]);
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
					case 'addition':
						break;
				}
			}
		});
	}
});
