import type { Fraction } from '../fraction';
import { levelOf, type Rules } from './engine';

/** Couleur par dénominateur : varie l'aspect sans trahir les équivalences. */
const BY_DENOMINATOR: Record<number, string> = {
	1: '#ffc93c',
	2: '#ffe3a3',
	3: '#ffe3a3',
	4: '#ffd0b5',
	6: '#ffd0b5',
	8: '#d4f0c4',
	9: '#d4f0c4',
	12: '#d3e6ff',
	15: '#d3e6ff',
	16: '#e8d9ff',
	18: '#e8d9ff',
	24: '#ffd6e8',
	27: '#ffd6e8'
};

/** Couleur par palier (mode aide) : deux tuiles équivalentes ont la même teinte. */
const BY_LEVEL = [
	'#fff1d6',
	'#ffe0b2',
	'#ffc98f',
	'#ffab76',
	'#ff9a8a',
	'#9be3b0',
	'#9fd0ff',
	'#d7c4ff'
];
const WHOLE = '#ffc93c';

export function tileColor(value: Fraction, byValue: boolean, rules: Rules): string {
	if (!byValue) return BY_DENOMINATOR[value.d] ?? '#f2e6d8';
	const level = levelOf(value, rules);
	const one = rules.levels.length - 1;
	if (level === one) return WHOLE;
	if (level > one) return BY_LEVEL[(level - one + 4) % BY_LEVEL.length];
	return BY_LEVEL[Math.max(0, level) % BY_LEVEL.length];
}
