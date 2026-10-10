/**
 * Arithmétique des fractions, en entiers uniquement.
 *
 * Aucune comparaison ne passe par un nombre à virgule : l'équivalence et l'ordre
 * se décident par produits en croix. Les fractions ne sont jamais simplifiées
 * implicitement, car la forme affichée compte autant que la valeur.
 */

export interface Fraction {
	readonly n: number;
	readonly d: number;
}

function assertInt(value: number, name: string): void {
	if (!Number.isSafeInteger(value)) {
		throw new RangeError(`${name} doit être un entier, reçu ${value}`);
	}
}

/** Construit une fraction valide. Le signe est porté par le numérateur. */
export function frac(n: number, d = 1): Fraction {
	assertInt(n, 'Le numérateur');
	assertInt(d, 'Le dénominateur');
	if (d === 0) throw new RangeError('Le dénominateur ne peut pas être 0');
	if (d < 0) return { n: -n || 0, d: -d };
	return { n, d };
}

/** Plus grand commun diviseur (toujours positif). pgcd(0, 0) vaut 0. */
export function pgcd(a: number, b: number): number {
	assertInt(a, 'a');
	assertInt(b, 'b');
	a = Math.abs(a);
	b = Math.abs(b);
	while (b !== 0) {
		[a, b] = [b, a % b];
	}
	return a;
}

/** Plus petit commun multiple (toujours positif). ppcm(0, x) vaut 0. */
export function ppcm(a: number, b: number): number {
	if (a === 0 || b === 0) return 0;
	return Math.abs((a / pgcd(a, b)) * b);
}

/** Forme irréductible. 0 s'écrit 0/1. */
export function simplify(f: Fraction): Fraction {
	if (f.n === 0) return { n: 0, d: 1 };
	const g = pgcd(f.n, f.d);
	return { n: f.n / g, d: f.d / g };
}

/** Même valeur, quelle que soit l'écriture (1/4 et 2/8). */
export function isEquivalent(a: Fraction, b: Fraction): boolean {
	return a.n * b.d === b.n * a.d;
}

/** Même écriture exacte (2/8 et 2/8, mais pas 1/4 et 2/8). */
export function isSameForm(a: Fraction, b: Fraction): boolean {
	return a.n === b.n && a.d === b.d;
}

/** -1 si a < b, 0 si a = b, 1 si a > b. */
export function compare(a: Fraction, b: Fraction): -1 | 0 | 1 {
	const diff = a.n * b.d - b.n * a.d;
	return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

export function isIrreducible(f: Fraction): boolean {
	return pgcd(f.n, f.d) === 1;
}

/** Vrai si la fraction est un nombre entier (8/8, 16/8, 2/1). */
export function isWhole(f: Fraction): boolean {
	return f.n % f.d === 0;
}

/**
 * Diviseurs communs au numérateur et au dénominateur, plus grands que 1,
 * par ordre croissant. Le dernier est le pgcd. Vide si la fraction est irréductible.
 */
export function commonDivisors(f: Fraction): number[] {
	const g = pgcd(f.n, f.d);
	const small: number[] = [];
	const large: number[] = [];
	for (let k = 2; k * k <= g; k++) {
		if (g % k === 0) {
			small.push(k);
			if (k * k !== g) large.unshift(g / k);
		}
	}
	const result = [...small, ...large];
	if (g > 1) result.push(g);
	return result;
}

/** Vrai si k divise à la fois le numérateur et le dénominateur. */
export function canDivideBy(f: Fraction, k: number): boolean {
	return Number.isSafeInteger(k) && k > 0 && f.n % k === 0 && f.d % k === 0;
}

/** Divise numérateur et dénominateur par k (simplification partielle). */
export function divideBy(f: Fraction, k: number): Fraction {
	if (!canDivideBy(f, k)) {
		throw new RangeError(`${k} ne divise pas ${toString(f)}`);
	}
	return { n: f.n / k, d: f.d / k };
}

/** Multiplie numérateur et dénominateur par k (amplification). */
export function amplify(f: Fraction, k: number): Fraction {
	assertInt(k, 'k');
	if (k <= 0) throw new RangeError('k doit être positif');
	return { n: f.n * k, d: f.d * k };
}

/**
 * Réécrit f avec le dénominateur d, si c'est possible avec un numérateur entier.
 * Exemple : expressOver(1/4, 12) donne 3/12, expressOver(1/3, 8) donne null.
 */
export function expressOver(f: Fraction, d: number): Fraction | null {
	assertInt(d, 'd');
	if (d <= 0) return null;
	const num = f.n * d;
	if (num % f.d !== 0) return null;
	return { n: num / f.d, d };
}

/**
 * Somme sur le plus petit dénominateur commun, sans simplifier.
 * 1/4 + 2/8 = 2/8 + 2/8 = 4/8.
 */
export function add(a: Fraction, b: Fraction): Fraction {
	const d = ppcm(a.d, b.d);
	return { n: a.n * (d / a.d) + b.n * (d / b.d), d };
}

/** Différence sur le plus petit dénominateur commun, sans simplifier. */
export function subtract(a: Fraction, b: Fraction): Fraction {
	return add(a, { n: -b.n, d: b.d });
}

/** Écriture texte : "3/4", ou "2" quand le dénominateur vaut 1. */
export function toString(f: Fraction): string {
	return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`;
}
