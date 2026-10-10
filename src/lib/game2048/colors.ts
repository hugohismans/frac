import type { Fraction } from '../fraction';
import { sixteenths } from './engine';

/** Couleur par dénominateur : varie l'aspect sans trahir les équivalences. */
const BY_DENOMINATOR: Record<number, string> = {
	1: '#ffc93c',
	2: '#ffe3a3',
	4: '#ffd0b5',
	8: '#d4f0c4',
	12: '#d3e6ff',
	16: '#e8d9ff',
	24: '#ffd6e8'
};

/** Couleur par valeur (mode aide) : deux tuiles équivalentes ont la même teinte. */
const BY_VALUE: Record<number, string> = {
	1: '#fff1d6',
	2: '#ffe0b2',
	4: '#ffc98f',
	8: '#ffab76',
	16: '#ffc93c',
	32: '#9be3b0',
	64: '#9fd0ff'
};

export function tileColor(value: Fraction, byValue: boolean): string {
	if (byValue) return BY_VALUE[sixteenths(value)] ?? '#d7c4ff';
	return BY_DENOMINATOR[value.d] ?? '#f2e6d8';
}
