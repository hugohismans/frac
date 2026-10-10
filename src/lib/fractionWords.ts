import type { Fraction } from './fraction';

const SPECIAL: Record<number, [string, string]> = {
	2: ['demi', 'demis'],
	3: ['tiers', 'tiers'],
	4: ['quart', 'quarts']
};

const ORDINALS: Record<number, string> = {
	5: 'cinquième',
	6: 'sixième',
	7: 'septième',
	8: 'huitième',
	9: 'neuvième',
	10: 'dixième',
	11: 'onzième',
	12: 'douzième',
	13: 'treizième',
	14: 'quatorzième',
	15: 'quinzième',
	16: 'seizième',
	17: 'dix-septième',
	18: 'dix-huitième',
	19: 'dix-neuvième',
	20: 'vingtième',
	21: 'vingt-et-unième',
	22: 'vingt-deuxième',
	23: 'vingt-troisième',
	24: 'vingt-quatrième'
};

/** Lecture en français, pour les lecteurs d'écran : « 3 quarts », « 1 huitième », « 2 ». */
export function fractionWords(f: Fraction): string {
	if (f.d === 1) return String(f.n);
	const plural = Math.abs(f.n) > 1;
	const special = SPECIAL[f.d];
	if (special) return `${f.n} ${special[plural ? 1 : 0]}`;
	const ordinal = ORDINALS[f.d];
	if (ordinal) return `${f.n} ${ordinal}${plural ? 's' : ''}`;
	return `${f.n} sur ${f.d}`;
}
