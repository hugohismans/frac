import type { Fraction } from '../fraction';

export type Cut = 2 | 3 | 4 | 6 | 8 | 12;
export type WorldId = 1 | 2 | 3 | 4;

/** Monde 1 : le joueur choisit la découpe, puis sélectionne les parts. */
export interface PartsOrder {
	kind: 'parts';
	order: Fraction;
	cutChoices: Cut[];
}

/** Monde 2 : la découpe est imposée et différente de la commande (1/2 avec une pizza en 8). */
export interface EquivalenceOrder {
	kind: 'equivalence';
	order: Fraction;
	imposedCut: Cut;
}

/**
 * Monde 3 : des parts sont déjà sur le plateau (tray), le joueur les regroupe.
 * Le client n'accepte que la forme irréductible.
 * ask = 'fraction' : la commande affiche la fraction voulue (3/4).
 * ask = 'fewestParts' : la commande dit seulement « le moins de parts possible ».
 */
export interface SimplifyOrder {
	kind: 'simplify';
	tray: Fraction;
	ask: 'fraction' | 'fewestParts';
}

/**
 * Monde 4 : combiner des restes de pizzas coupées différemment.
 * Le joueur choisit les restes à mettre sur le plateau et peut les recouper
 * pour que toutes les parts aient la même taille (dénominateur commun).
 */
export interface AdditionOrder {
	kind: 'addition';
	leftovers: Fraction[];
	order: Fraction;
}

export type Order = PartsOrder | EquivalenceOrder | SimplifyOrder | AdditionOrder;

export interface Level {
	/** "w1-l3" */
	id: string;
	world: WorldId;
	/** 1 à 8 */
	index: number;
	customers: Order[];
	/** Petit conseil affiché avant de commencer. */
	tip?: string;
}

export interface World {
	id: WorldId;
	name: string;
	/** Le concept nouveau du monde, en une phrase pour l'enfant. */
	concept: string;
	/** Explication affichée au premier niveau du monde. */
	intro: string;
	levels: Level[];
	/** Monde pas encore jouable. */
	comingSoon?: boolean;
}

/** Résultat d'un service. */
export type Verdict = 'exact' | 'tooLittle' | 'tooMuch' | 'notSimplest';
