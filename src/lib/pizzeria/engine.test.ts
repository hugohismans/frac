import { describe, expect, it } from 'vitest';
import { PIZZERIA } from '../settings';
import {
	countSelected,
	cutWorks,
	difference,
	isLevelUnlocked,
	isWorldUnlocked,
	judge,
	judgeSimplify,
	nextLevel,
	partsNeeded,
	regroup,
	servedValue,
	starsFor,
	target
} from './engine';
import { WORLDS, findLevel } from './levels';

const f = (n: number, d: number) => ({ n, d });

describe('judge', () => {
	it('accepte la quantité exacte, quelle que soit la découpe', () => {
		expect(judge(f(3, 4), f(3, 4))).toBe('exact');
		expect(judge(f(6, 8), f(3, 4))).toBe('exact');
		expect(judge(f(4, 8), f(1, 2))).toBe('exact');
	});
	it('distingue trop peu et trop', () => {
		expect(judge(f(2, 4), f(3, 4))).toBe('tooLittle');
		expect(judge(f(7, 8), f(3, 4))).toBe('tooMuch');
		expect(judge(f(0, 4), f(1, 4))).toBe('tooLittle');
	});
});

describe('judgeSimplify', () => {
	it('n’accepte que la forme irréductible', () => {
		expect(judgeSimplify(f(3, 4))).toBe('exact');
		expect(judgeSimplify(f(6, 8))).toBe('notSimplest');
		expect(judgeSimplify(f(1, 1))).toBe('exact');
		expect(judgeSimplify(f(4, 4))).toBe('notSimplest');
	});
});

describe('difference', () => {
	it('donne l’écart simplifié', () => {
		expect(difference(f(5, 8), f(3, 4))).toEqual(f(1, 8));
		expect(difference(f(7, 8), f(3, 4))).toEqual(f(1, 8));
		expect(difference(f(1, 4), f(3, 4))).toEqual(f(1, 2));
		expect(difference(f(2, 3), f(1, 2))).toEqual(f(1, 6));
	});
});

describe('target', () => {
	it('lit la commande ou simplifie le plateau', () => {
		expect(target({ kind: 'parts', order: f(3, 4), cutChoices: [4] })).toEqual(f(3, 4));
		expect(target({ kind: 'simplify', tray: f(6, 8), ask: 'fraction' })).toEqual(f(3, 4));
	});
});

describe('découpes', () => {
	it('sait si une découpe permet de servir la commande', () => {
		expect(cutWorks(f(3, 4), 8)).toBe(true);
		expect(cutWorks(f(3, 4), 6)).toBe(false);
		expect(partsNeeded(f(1, 2), 8)).toBe(4);
		expect(partsNeeded(f(2, 3), 4)).toBeNull();
	});
});

describe('regroup', () => {
	it('regroupe quand k divise les deux nombres', () => {
		expect(regroup(f(6, 8), 2)).toEqual({ ok: true, value: f(3, 4) });
		expect(regroup(f(8, 12), 4)).toEqual({ ok: true, value: f(2, 3) });
		expect(regroup(f(4, 4), 4)).toEqual({ ok: true, value: f(1, 1) });
	});
	it('explique pourquoi c’est impossible', () => {
		expect(regroup(f(6, 8), 3)).toEqual({ ok: false, reason: 'pizza', leftover: 2, k: 3 });
		expect(regroup(f(6, 8), 4)).toEqual({ ok: false, reason: 'tray', leftover: 2, k: 4 });
		expect(regroup(f(6, 8), 1).ok).toBe(false);
	});
});

describe('sélection', () => {
	it('compte et convertit en fraction', () => {
		const sel = [true, false, true, true];
		expect(countSelected(sel)).toBe(3);
		expect(servedValue(sel)).toEqual(f(3, 4));
		expect(servedValue([])).toEqual(f(0, 1));
	});
});

describe('étoiles', () => {
	it('dépendent du nombre de services ratés', () => {
		expect(starsFor(0)).toBe(3);
		expect(starsFor(PIZZERIA.STARS_2_MAX_ERRORS)).toBe(2);
		expect(starsFor(PIZZERIA.STARS_2_MAX_ERRORS + 1)).toBe(1);
		expect(starsFor(50)).toBe(1);
	});
});

describe('déblocages', () => {
	const w1l1 = findLevel(1, 1)!;
	const w1l2 = findLevel(1, 2)!;
	const w2l1 = findLevel(2, 1)!;

	it('au départ, seul le premier niveau du monde 1 est ouvert', () => {
		expect(isLevelUnlocked(w1l1, WORLDS, {})).toBe(true);
		expect(isLevelUnlocked(w1l2, WORLDS, {})).toBe(false);
		expect(isLevelUnlocked(w2l1, WORLDS, {})).toBe(false);
	});
	it('réussir un niveau ouvre le suivant', () => {
		expect(isLevelUnlocked(w1l2, WORLDS, { 'w1-l1': 1 })).toBe(true);
	});
	it('le monde suivant s’ouvre après assez de niveaux réussis', () => {
		const stars: Record<string, number> = {};
		for (let i = 1; i < PIZZERIA.WORLD_UNLOCK_COUNT; i++) stars[`w1-l${i}`] = 2;
		expect(isWorldUnlocked(WORLDS[1], WORLDS, stars)).toBe(false);
		stars[`w1-l${PIZZERIA.WORLD_UNLOCK_COUNT}`] = 1;
		expect(isWorldUnlocked(WORLDS[1], WORLDS, stars)).toBe(true);
		expect(isLevelUnlocked(w2l1, WORLDS, stars)).toBe(true);
	});
	it('le mode enseignant ouvre tous les niveaux sans toucher aux étoiles', () => {
		for (const world of WORLDS.filter((w) => !w.comingSoon)) {
			expect(isWorldUnlocked(world, WORLDS, {}, true)).toBe(true);
			for (const level of world.levels) expect(isLevelUnlocked(level, WORLDS, {}, true)).toBe(true);
		}
		expect(isLevelUnlocked(findLevel(3, 8)!, WORLDS, {}, false)).toBe(false);
	});
	it('même en mode enseignant, le monde 4 reste fermé', () => {
		expect(isWorldUnlocked(WORLDS[3], WORLDS, {}, true)).toBe(false);
	});
	it('le monde 4 reste fermé', () => {
		const all = Object.fromEntries(WORLDS.flatMap((w) => w.levels).map((l) => [l.id, 3]));
		expect(isWorldUnlocked(WORLDS[3], WORLDS, all)).toBe(false);
	});
	it('enchaîne les niveaux puis les mondes', () => {
		expect(nextLevel(w1l1, WORLDS)?.id).toBe('w1-l2');
		expect(nextLevel(findLevel(1, 8)!, WORLDS)?.id).toBe('w2-l1');
		expect(nextLevel(findLevel(3, 8)!, WORLDS)).toBeNull();
	});
});
