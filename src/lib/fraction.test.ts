import { describe, expect, it } from 'vitest';
import {
	add,
	amplify,
	canDivideBy,
	commonDivisors,
	compare,
	divideBy,
	expressOver,
	frac,
	isEquivalent,
	isIrreducible,
	isSameForm,
	isWhole,
	pgcd,
	ppcm,
	simplify,
	subtract,
	toString,
	type Fraction
} from './fraction';

const f = (n: number, d: number): Fraction => ({ n, d });

describe('frac', () => {
	it('construit une fraction', () => {
		expect(frac(3, 4)).toEqual(f(3, 4));
		expect(frac(5)).toEqual(f(5, 1));
	});
	it('porte le signe sur le numérateur', () => {
		expect(frac(3, -4)).toEqual(f(-3, 4));
		expect(frac(-3, -4)).toEqual(f(3, 4));
		expect(Object.is(frac(0, -4).n, -0)).toBe(false);
	});
	it('refuse un dénominateur nul et les nombres à virgule', () => {
		expect(() => frac(1, 0)).toThrow(RangeError);
		expect(() => frac(0.5, 2)).toThrow(RangeError);
		expect(() => frac(1, 2.5)).toThrow(RangeError);
		expect(() => frac(Number.NaN, 2)).toThrow(RangeError);
	});
});

describe('pgcd', () => {
	it.each([
		[12, 8, 4],
		[8, 12, 4],
		[7, 3, 1],
		[16, 16, 16],
		[0, 5, 5],
		[5, 0, 5],
		[0, 0, 0],
		[-12, 8, 4],
		[12, -8, 4],
		[48, 36, 12]
	])('pgcd(%i, %i) = %i', (a, b, expected) => {
		expect(pgcd(a, b)).toBe(expected);
	});
	it('refuse les nombres à virgule', () => {
		expect(() => pgcd(1.5, 3)).toThrow(RangeError);
	});
});

describe('ppcm', () => {
	it.each([
		[4, 8, 8],
		[4, 6, 12],
		[12, 16, 48],
		[3, 5, 15],
		[1, 7, 7],
		[0, 7, 0],
		[-4, 6, 12]
	])('ppcm(%i, %i) = %i', (a, b, expected) => {
		expect(ppcm(a, b)).toBe(expected);
	});
});

describe('simplify', () => {
	it.each([
		[f(6, 8), f(3, 4)],
		[f(4, 8), f(1, 2)],
		[f(3, 12), f(1, 4)],
		[f(8, 8), f(1, 1)],
		[f(16, 8), f(2, 1)],
		[f(3, 4), f(3, 4)],
		[f(0, 8), f(0, 1)],
		[f(-6, 8), f(-3, 4)]
	])('simplify(%o) = %o', (input, expected) => {
		expect(simplify(input)).toEqual(expected);
	});
	it('est idempotente', () => {
		for (let d = 1; d <= 24; d++) {
			for (let n = 0; n <= 2 * d; n++) {
				const once = simplify(f(n, d));
				expect(simplify(once)).toEqual(once);
				expect(isIrreducible(once)).toBe(true);
				expect(isEquivalent(once, f(n, d))).toBe(true);
			}
		}
	});
	it('ne modifie pas la fraction reçue', () => {
		const input = f(6, 8);
		simplify(input);
		expect(input).toEqual(f(6, 8));
	});
});

describe('isEquivalent', () => {
	it('reconnaît les écritures équivalentes', () => {
		expect(isEquivalent(f(1, 4), f(2, 8))).toBe(true);
		expect(isEquivalent(f(3, 12), f(2, 8))).toBe(true);
		expect(isEquivalent(f(1, 2), f(8, 16))).toBe(true);
		expect(isEquivalent(f(8, 8), f(1, 1))).toBe(true);
		expect(isEquivalent(f(0, 3), f(0, 8))).toBe(true);
	});
	it('distingue les valeurs différentes', () => {
		expect(isEquivalent(f(1, 4), f(1, 3))).toBe(false);
		expect(isEquivalent(f(2, 8), f(2, 6))).toBe(false);
		expect(isEquivalent(f(1, 2), f(-1, 2))).toBe(false);
	});
	it('distingue des valeurs très proches (pas de flottants)', () => {
		expect(isEquivalent(f(1, 3), f(333333, 1000000))).toBe(false);
		expect(isEquivalent(f(1, 10), f(3, 30))).toBe(true);
	});
	it('est symétrique', () => {
		expect(isEquivalent(f(2, 8), f(1, 4))).toBe(isEquivalent(f(1, 4), f(2, 8)));
	});
});

describe('isSameForm', () => {
	it('compare l’écriture, pas la valeur', () => {
		expect(isSameForm(f(2, 8), f(2, 8))).toBe(true);
		expect(isSameForm(f(1, 4), f(2, 8))).toBe(false);
	});
});

describe('compare', () => {
	it('ordonne les fractions', () => {
		expect(compare(f(1, 4), f(1, 3))).toBe(-1);
		expect(compare(f(3, 4), f(2, 3))).toBe(1);
		expect(compare(f(2, 8), f(1, 4))).toBe(0);
		expect(compare(f(5, 8), f(1, 2))).toBe(1);
		expect(compare(f(-1, 2), f(0, 1))).toBe(-1);
	});
	it('est antisymétrique', () => {
		const values = [f(1, 2), f(1, 3), f(2, 3), f(3, 4), f(5, 8), f(7, 12)];
		for (const a of values) {
			for (const b of values) {
				expect(compare(a, b)).toBe(-compare(b, a) || 0);
			}
		}
	});
	it('départage 1/3 et 0,333333 sans flottant', () => {
		expect(compare(f(1, 3), f(333333, 1000000))).toBe(1);
	});
});

describe('isIrreducible', () => {
	it.each([
		[f(3, 4), true],
		[f(1, 2), true],
		[f(6, 8), false],
		[f(8, 8), false],
		[f(1, 1), true],
		[f(5, 1), true],
		[f(0, 1), true],
		[f(0, 5), false]
	])('isIrreducible(%o) = %s', (input, expected) => {
		expect(isIrreducible(input)).toBe(expected);
	});
});

describe('isWhole', () => {
	it('reconnaît les entiers', () => {
		expect(isWhole(f(8, 8))).toBe(true);
		expect(isWhole(f(16, 8))).toBe(true);
		expect(isWhole(f(2, 1))).toBe(true);
		expect(isWhole(f(0, 4))).toBe(true);
		expect(isWhole(f(6, 8))).toBe(false);
		expect(isWhole(f(12, 8))).toBe(false);
	});
});

describe('commonDivisors', () => {
	it.each([
		[f(6, 8), [2]],
		[f(4, 8), [2, 4]],
		[f(8, 8), [2, 4, 8]],
		[f(6, 12), [2, 3, 6]],
		[f(12, 24), [2, 3, 4, 6, 12]],
		[f(3, 12), [3]],
		[f(16, 16), [2, 4, 8, 16]],
		[f(9, 12), [3]],
		[f(3, 4), []],
		[f(1, 1), []]
	])('commonDivisors(%o) = %o', (input, expected) => {
		expect(commonDivisors(input)).toEqual(expected);
	});
	it('se termine toujours par le pgcd et ne liste que de vrais diviseurs', () => {
		for (let d = 1; d <= 24; d++) {
			for (let n = 1; n <= 2 * d; n++) {
				const divs = commonDivisors(f(n, d));
				const g = pgcd(n, d);
				if (g === 1) {
					expect(divs).toEqual([]);
				} else {
					expect(divs.at(-1)).toBe(g);
				}
				for (const k of divs) {
					expect(n % k).toBe(0);
					expect(d % k).toBe(0);
				}
				expect([...divs].sort((a, b) => a - b)).toEqual(divs);
			}
		}
	});
});

describe('divideBy / canDivideBy', () => {
	it('simplifie partiellement', () => {
		expect(divideBy(f(8, 16), 2)).toEqual(f(4, 8));
		expect(divideBy(f(8, 16), 8)).toEqual(f(1, 2));
		expect(divideBy(f(6, 12), 3)).toEqual(f(2, 4));
	});
	it('refuse un diviseur qui ne divise pas les deux', () => {
		expect(canDivideBy(f(6, 8), 3)).toBe(false);
		expect(canDivideBy(f(6, 8), 0)).toBe(false);
		expect(canDivideBy(f(6, 8), 1.5)).toBe(false);
		expect(() => divideBy(f(6, 8), 3)).toThrow(RangeError);
	});
});

describe('amplify', () => {
	it('multiplie les deux termes', () => {
		expect(amplify(f(1, 4), 3)).toEqual(f(3, 12));
		expect(() => amplify(f(1, 4), 0)).toThrow(RangeError);
	});
});

describe('expressOver', () => {
	it('réécrit sur un autre dénominateur quand c’est possible', () => {
		expect(expressOver(f(1, 4), 12)).toEqual(f(3, 12));
		expect(expressOver(f(3, 12), 16)).toEqual(f(4, 16));
		expect(expressOver(f(4, 8), 2)).toEqual(f(1, 2));
		expect(expressOver(f(2, 1), 8)).toEqual(f(16, 8));
	});
	it('renvoie null sinon', () => {
		expect(expressOver(f(1, 3), 8)).toBeNull();
		expect(expressOver(f(1, 4), 6)).toBeNull();
		expect(expressOver(f(1, 4), 0)).toBeNull();
	});
});

describe('add', () => {
	it('additionne sur le plus petit dénominateur commun, sans simplifier', () => {
		expect(add(f(1, 4), f(2, 8))).toEqual(f(4, 8));
		expect(add(f(1, 4), f(1, 4))).toEqual(f(2, 4));
		expect(add(f(4, 8), f(1, 2))).toEqual(f(8, 8));
		expect(add(f(3, 12), f(1, 4))).toEqual(f(6, 12));
		expect(add(f(1, 3), f(1, 4))).toEqual(f(7, 12));
		expect(add(f(8, 8), f(1, 1))).toEqual(f(16, 8));
	});
	it('est commutative en valeur et en écriture', () => {
		const values = [f(1, 2), f(2, 8), f(3, 12), f(1, 3), f(5, 6), f(2, 16)];
		for (const a of values) {
			for (const b of values) {
				expect(add(a, b)).toEqual(add(b, a));
			}
		}
	});
	it('a pour valeur la somme exacte', () => {
		for (let d1 = 1; d1 <= 12; d1++) {
			for (let d2 = 1; d2 <= 12; d2++) {
				const s = add(f(1, d1), f(1, d2));
				expect(s.n * d1 * d2).toBe(s.d * (d1 + d2));
			}
		}
	});
	it('est associative en valeur', () => {
		const a = f(1, 4);
		const b = f(1, 6);
		const c = f(3, 8);
		expect(isEquivalent(add(add(a, b), c), add(a, add(b, c)))).toBe(true);
	});
});

describe('subtract', () => {
	it('soustrait sur le dénominateur commun', () => {
		expect(subtract(f(3, 4), f(1, 2))).toEqual(f(1, 4));
		expect(subtract(f(1, 2), f(3, 4))).toEqual(f(-1, 4));
		expect(subtract(f(6, 8), f(3, 4))).toEqual(f(0, 8));
	});
});

describe('toString', () => {
	it('écrit la fraction', () => {
		expect(toString(f(3, 4))).toBe('3/4');
		expect(toString(f(8, 8))).toBe('8/8');
		expect(toString(f(2, 1))).toBe('2');
	});
});
