/**
 * Les niveaux de la Pizzeria. Données pures : on peut en ajouter ou en modifier ici
 * sans toucher au code. levels.test.ts vérifie que chaque commande est réalisable.
 */

import { parseFraction } from '../game2048/engine';
import type { Cut, Level, Order, World, WorldId } from './types';

const f = parseFraction;

function parts(order: string, ...cutChoices: Cut[]): Order {
	return { kind: 'parts', order: f(order), cutChoices };
}

function equiv(order: string, imposedCut: Cut): Order {
	return { kind: 'equivalence', order: f(order), imposedCut };
}

function tray(value: string, ask: 'fraction' | 'fewestParts' = 'fraction'): Order {
	return { kind: 'simplify', tray: f(value), ask };
}

function rest(order: string, ...leftovers: string[]): Order {
	return { kind: 'addition', order: f(order), leftovers: leftovers.map(f) };
}

function levels(world: WorldId, list: { customers: Order[]; tip?: string }[]): Level[] {
	return list.map((l, i) => ({ id: `w${world}-l${i + 1}`, world, index: i + 1, ...l }));
}

export const WORLDS: World[] = [
	{
		id: 1,
		name: 'Les parts',
		concept: 'Couper la pizza et compter les parts.',
		intro:
			'Un client commande une fraction de pizza. Choisis en combien de parts couper, puis touche les parts à servir.',
		levels: levels(1, [
			{
				customers: [parts('1/2', 2), parts('1/4', 4), parts('3/4', 4)],
				tip: 'Le nombre du bas dit en combien de parts couper. Celui du haut, combien en servir.'
			},
			{ customers: [parts('1/3', 3), parts('2/3', 3), parts('1/2', 2, 4)] },
			{ customers: [parts('1/4', 2, 4), parts('3/4', 3, 4), parts('2/3', 3, 4)] },
			{ customers: [parts('1/6', 4, 6), parts('5/6', 6, 8), parts('3/8', 4, 8)] },
			{ customers: [parts('5/8', 6, 8), parts('1/12', 8, 12), parts('7/12', 6, 12)] },
			{
				customers: [
					parts('2/3', 2, 3, 6),
					parts('3/4', 2, 4, 8),
					parts('5/6', 3, 6, 12),
					parts('3/8', 4, 8, 12)
				]
			},
			{
				customers: [
					parts('7/12', 4, 6, 12),
					parts('5/8', 4, 6, 8),
					parts('1/3', 2, 3, 4),
					parts('11/12', 8, 12)
				]
			},
			{
				customers: [
					parts('3/4', 3, 4, 6, 8),
					parts('5/12', 4, 6, 8, 12),
					parts('7/8', 3, 6, 8, 12),
					parts('2/3', 3, 4, 6, 8)
				],
				tip: 'Parfois, plusieurs découpes marchent. À toi de choisir !'
			}
		])
	},
	{
		id: 2,
		name: 'Les équivalences',
		concept: 'La même quantité avec d’autres parts.',
		intro:
			'Le chef a déjà coupé la pizza, et pas comme la commande ! Sers quand même la bonne quantité.',
		levels: levels(2, [
			{
				customers: [equiv('1/2', 4), equiv('1/2', 8), equiv('1/4', 8)],
				tip: 'Une moitié, c’est 2 parts sur 4, ou 4 parts sur 8 !'
			},
			{ customers: [equiv('1/2', 6), equiv('1/3', 6), equiv('2/3', 6)] },
			{ customers: [equiv('3/4', 8), equiv('1/4', 12), equiv('1/2', 12)] },
			{ customers: [equiv('2/3', 12), equiv('1/6', 12), equiv('5/6', 12)] },
			{ customers: [equiv('1/3', 12), equiv('3/4', 12), equiv('2/4', 8)] },
			{ customers: [equiv('1/4', 8), equiv('2/3', 6), equiv('3/4', 12), equiv('5/6', 12)] },
			{
				customers: [equiv('6/8', 4), equiv('2/6', 3), equiv('4/8', 2), equiv('9/12', 4)],
				tip: 'Cette fois, la pizza a moins de parts que la commande. Regarde la quantité !'
			},
			{ customers: [equiv('4/6', 3), equiv('9/12', 8), equiv('2/8', 4), equiv('3/6', 4)] }
		])
	},
	{
		id: 3,
		name: 'La simplification',
		concept: 'Moins de parts, mais plus grosses.',
		intro:
			'Des parts attendent sur le plateau. Le client veut le moins de parts possible : regroupe-les, puis sers !',
		levels: levels(3, [
			{
				customers: [tray('2/4'), tray('2/8'), tray('6/8')],
				tip: 'Regrouper par 2 colle les parts deux par deux.'
			},
			{ customers: [tray('2/6'), tray('4/6'), tray('4/8')] },
			{ customers: [tray('3/6'), tray('3/12'), tray('9/12')] },
			{ customers: [tray('4/12'), tray('8/12'), tray('6/12')] },
			{
				customers: [
					tray('2/4', 'fewestParts'),
					tray('6/8', 'fewestParts'),
					tray('4/6', 'fewestParts')
				],
				tip: 'Le client ne dit plus la fraction. Regroupe jusqu’à ce que ce ne soit plus possible.'
			},
			{
				customers: [
					tray('3/12', 'fewestParts'),
					tray('10/12', 'fewestParts'),
					tray('6/8', 'fewestParts'),
					tray('2/12', 'fewestParts')
				]
			},
			{
				customers: [
					tray('4/8', 'fewestParts'),
					tray('8/12'),
					tray('9/12', 'fewestParts'),
					tray('4/4', 'fewestParts')
				]
			},
			{
				customers: [
					tray('6/12', 'fewestParts'),
					tray('8/8', 'fewestParts'),
					tray('10/12', 'fewestParts'),
					tray('3/3', 'fewestParts')
				]
			}
		])
	},
	{
		id: 4,
		name: 'Les restes',
		concept: 'Additionner des restes de pizzas.',
		intro:
			'Plus de pizza fraîche ! Combine les restes pour servir la commande. Recoupe le plateau pour que toutes les parts aient la même taille, et compte.',
		levels: levels(4, [
			{
				customers: [
					rest('3/4', '1/4', '2/4'),
					rest('5/6', '2/6', '3/6'),
					rest('7/8', '3/8', '4/8')
				],
				tip: 'Quand les parts ont la même taille, il suffit de les compter.'
			},
			{
				customers: [
					rest('3/4', '1/2', '1/4'),
					rest('5/8', '1/2', '1/8'),
					rest('3/8', '1/4', '1/8')
				],
				tip: 'Les parts n’ont pas la même taille ? Recoupe le plateau !'
			},
			{
				customers: [
					rest('3/4', '1/2', '1/4', '1/8'),
					rest('5/8', '1/4', '1/2', '1/8'),
					rest('5/6', '1/3', '1/6', '1/2')
				],
				tip: 'Il y a plus de restes que nécessaire : choisis les bons.'
			},
			{
				customers: [
					rest('1/2', '1/3', '1/6'),
					rest('5/6', '2/3', '1/6'),
					rest('1/2', '1/3', '1/3', '1/6')
				]
			},
			{
				customers: [
					rest('5/6', '1/2', '1/3'),
					rest('2/3', '1/2', '1/6'),
					rest('5/6', '1/3', '1/2', '1/6')
				]
			},
			{
				customers: [
					rest('7/12', '1/4', '1/3'),
					rest('11/12', '1/4', '2/3'),
					rest('1/2', '1/3', '1/4', '1/6'),
					rest('3/4', '1/12', '1/4', '1/2')
				]
			},
			{
				customers: [
					rest('1', '1/2', '1/4', '1/4'),
					rest('1', '2/3', '1/3'),
					rest('1', '1/2', '1/3', '1/6'),
					rest('1', '3/4', '1/8', '1/8')
				],
				tip: 'Cette fois, il faut une pizza entière !'
			},
			{
				customers: [
					rest('11/12', '1/2', '1/3', '1/12'),
					rest('2/3', '1/4', '1/6', '1/2'),
					rest('5/8', '3/8', '1/4', '1/8'),
					rest('2/3', '1/3', '5/12', '1/4')
				]
			}
		])
	}
];

export function findLevel(world: number, index: number): Level | undefined {
	return WORLDS.find((w) => w.id === world)?.levels.find((l) => l.index === index);
}

export function findWorld(world: number): World | undefined {
	return WORLDS.find((w) => w.id === world);
}

export function allLevels(): Level[] {
	return WORLDS.flatMap((w) => w.levels);
}
