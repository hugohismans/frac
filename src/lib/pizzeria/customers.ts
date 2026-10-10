/** Les clients de la pizzeria : un prénom et une apparence, choisis de façon stable par niveau. */

export interface Look {
	skin: string;
	hair: string;
	shirt: string;
	style: 'short' | 'long' | 'curly' | 'bald' | 'bun' | 'cap';
	glasses: boolean;
}

export interface CustomerInfo {
	name: string;
	look: Look;
}

const NAMES = [
	'Léa',
	'Noah',
	'Mamie Rose',
	'Monsieur Pépin',
	'Inès',
	'Sami',
	'Lucie',
	'Arthur',
	'Zoé',
	'Malik',
	'Emma',
	'Jules',
	'Nora',
	'Théo'
];

const SKINS = ['#f6d3b3', '#e8b48a', '#c98b5e', '#8d5a3b', '#f2c9a0'];
const HAIRS = ['#3b2414', '#7a4a21', '#d9a441', '#1f1a17', '#b8b2a7', '#a8442a'];
const SHIRTS = ['#2f6fb3', '#2f8a4c', '#8a4fbf', '#d9822b', '#c7372a', '#1f8a8a'];
const STYLES: Look['style'][] = ['short', 'long', 'curly', 'bald', 'bun', 'cap'];

function hash(text: string): number {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

export function customerFor(levelId: string, index: number): CustomerInfo {
	const h = hash(`${levelId}#${index}`);
	const name = NAMES[h % NAMES.length];
	const pick = <T>(list: readonly T[], salt: number) => list[(h >>> salt) % list.length];
	return {
		name,
		look: {
			skin: pick(SKINS, 3),
			hair: pick(HAIRS, 7),
			shirt: pick(SHIRTS, 11),
			style: name.startsWith('Monsieur') ? 'bald' : pick(STYLES, 15),
			glasses: name.startsWith('Mamie') || ((h >>> 19) & 3) === 0
		}
	};
}
