/**
 * Toutes les constantes de gameplay et de ressenti, au même endroit.
 * Modifier une valeur ici suffit : aucun autre fichier ne doit contenir de nombre magique
 * lié au jeu (durées, probabilités, points, vibrations).
 */

// ---------------------------------------------------------------------------
// Ressenti général
// ---------------------------------------------------------------------------

export const FEEL = {
	/** Taille minimale d'une cible tactile, en px. */
	MIN_TOUCH_PX: 48,
	/** Distance minimale d'un glissé pour qu'il compte comme un swipe, en px. */
	SWIPE_MIN_PX: 28,
	/** Au-delà de cette distance, un appui n'est plus un tap ni un appui long, en px. */
	TAP_MAX_MOVE_PX: 12,
	/** Durée d'un appui pour déclencher l'appui long, en ms. */
	LONG_PRESS_MS: 420,
	/** Durée d'affichage d'un message court (toast), en ms. */
	TOAST_MS: 1800,
	/**
	 * Facteur appliqué aux durées quand prefers-reduced-motion est actif.
	 * 0 = pas de déplacement animé, les éléments apparaissent en fondu court.
	 */
	REDUCED_MOTION_FACTOR: 0
} as const;

// ---------------------------------------------------------------------------
// Retour haptique (navigator.vibrate). Une durée en ms ou un motif [vibre, pause, vibre...].
// ---------------------------------------------------------------------------

export const HAPTICS = {
	ENABLED_BY_DEFAULT: true,
	move: 0,
	merge: 12,
	simplify: 18,
	simplifyPgcd: [18, 40, 28],
	invalid: [8, 50, 8],
	win: [30, 60, 30, 60, 90],
	gameOver: [60],
	tap: 6,
	serveGood: [20, 50, 40],
	serveBad: [30, 60, 30],
	regroup: [15, 30, 15]
} as const satisfies Record<string, number | readonly number[] | boolean>;

// ---------------------------------------------------------------------------
// Fraction 2048
// ---------------------------------------------------------------------------

export interface Variant2048 {
	id: string;
	/** Nom affiché dans le menu. */
	name: string;
	/** Petite phrase d'explication pour l'enfant. */
	description: string;
	/** Dénominateur de la brique de base : 16 pour la brique 1/16. */
	brick: number;
	/**
	 * Échelle de la brique jusqu'à 1 : combien de tuiles égales il faut réunir à chaque palier.
	 * [2, 2, 3] avec la brique 1/12 : 1/12 -> 1/6 -> 1/3 -> 1. Le produit doit valoir `brick`.
	 */
	ladder: number[];
	/** Poids d'apparition des premiers paliers (le premier = la brique). */
	spawnWeights: number[];
	/** Taille de grille proposée par défaut. */
	defaultSize: number;
	/** Plafond du dénominateur pour cette variante (sinon MAX_DENOMINATOR, et au moins `brick`). */
	maxDenominator?: number;
	/**
	 * Après 1, nombre de tuiles égales à réunir pour continuer (1 -> 2 -> 4 avec 2, 1 -> 3 -> 9 avec 3).
	 * Par défaut : le dernier palier de l'échelle.
	 */
	afterOne?: number;
}

export const G2048 = {
	/** Tailles de grille proposées (N x N). */
	SIZES: [3, 4, 5, 6],
	START_TILES: 2,

	/** Durée du glissement des tuiles, en ms. */
	SLIDE_MS: 140,
	/** Durée du « pop » d'une tuile fusionnée ou nouvelle, en ms. */
	POP_MS: 180,
	/** Durée de l'animation de simplification (÷k), en ms. */
	SIMPLIFY_MS: 320,
	/** Écart entre les tuiles, en px (réduit automatiquement sur les grandes grilles). */
	TILE_GAP_PX: 8,

	/**
	 * Les variantes : une brique de base et son échelle jusqu'à 1. Tout le reste en est déduit
	 * (valeurs possibles, écritures qui apparaissent, nombre de tuiles à réunir).
	 */
	VARIANTS: [
		{
			id: 'moities',
			name: 'Moitiés',
			description: 'Brique 1/16. Deux tuiles égales fusionnent.',
			brick: 16,
			ladder: [2, 2, 2, 2],
			spawnWeights: [30, 45, 25],
			defaultSize: 4
		},
		{
			id: 'tiers',
			name: 'Tiers',
			description: 'Brique 1/9. Il faut trois tuiles égales alignées.',
			brick: 9,
			ladder: [3, 3],
			spawnWeights: [90, 10],
			defaultSize: 5
		},
		{
			id: 'douziemes',
			name: 'Douzièmes',
			description: 'Brique 1/12. Par deux, puis par trois pour les tiers.',
			brick: 12,
			ladder: [2, 2, 3],
			spawnWeights: [45, 40, 15],
			defaultSize: 5
		},
		{
			id: 'expert',
			name: 'Expert',
			description: 'Brique 1/27. Toujours par trois !',
			brick: 27,
			ladder: [3, 3, 3],
			spawnWeights: [70, 30],
			defaultSize: 5,
			maxDenominator: 27
		}
	] satisfies Variant2048[] as Variant2048[],
	DEFAULT_VARIANT: 'moities',

	/** Probabilité qu'une nouvelle tuile apparaisse sous une forme non simplifiée (si possible). */
	SPAWN_UNSIMPLIFIED_P: 0.6,

	/**
	 * Une fusion écrit le résultat sur le plus petit dénominateur commun.
	 * S'il dépasse ce plafond (ex. 12 et 8 donnent 24), on garde le plus grand des dénominateurs
	 * (3/12 + 2/8 = 6/12). Sert aussi de limite aux écritures qui apparaissent.
	 */
	MAX_DENOMINATOR: 16,

	/** Points d'une fusion = valeur du résultat x ce nombre (une fusion qui donne 1 rapporte 160). */
	MERGE_POINTS_PER_WHOLE: 160,
	/** Points d'une simplification directe par le PGCD (avant multiplicateur de combo). */
	SIMPLIFY_PGCD_POINTS: 30,
	/** Points d'une simplification partielle (diviseur plus petit que le PGCD). */
	SIMPLIFY_PARTIAL_POINTS: 5,
	/** Multiplicateur de combo : 1 + COMBO_STEP x combo, plafonné à COMBO_MAX_MULT. */
	COMBO_STEP: 0.5,
	COMBO_MAX_MULT: 4,
	/** Le combo retombe à 0 après ce nombre de coups joués sans simplification. */
	COMBO_RESET_AFTER_MOVES: 4,
	/** Points bonus la première fois qu'on atteint 1 entier. */
	FIRST_WHOLE_BONUS: 500,

	/**
	 * Nombre de « faux » diviseurs ajoutés aux diviseurs communs dans le sélecteur.
	 * 0 = on ne propose que des diviseurs qui marchent.
	 */
	DIVISOR_DISTRACTORS: 1,
	/** Réservoir de faux diviseurs possibles (on prend ceux qui ne marchent pas). */
	DIVISOR_DISTRACTOR_POOL: [2, 3, 4, 5, 6],

	/** Options d'aide par défaut. */
	HELP_LONG_PRESS_DEFAULT: true,
	HELP_COLOR_BY_VALUE_DEFAULT: false
} as const;

// ---------------------------------------------------------------------------
// La Pizzeria
// ---------------------------------------------------------------------------

export const PIZZERIA = {
	/** Découpes possibles d'une pizza. */
	CUTS: [2, 3, 4, 6, 8, 12],
	/** Boutons « Regrouper par k » proposés dans le monde 3. */
	REGROUP_CHOICES: [2, 3, 4, 6],

	/** Taille maximale de la pizza de travail, en px. */
	PIZZA_MAX_PX: 280,

	/** Arrivée d'un client, en ms. */
	ARRIVE_MS: 450,
	/** La pizza part vers le client, en ms. */
	SERVE_MS: 450,
	/** Temps de la réaction joyeuse avant que le client parte, en ms. */
	HAPPY_MS: 1300,
	/** Départ d'un client, en ms. */
	LEAVE_MS: 400,
	/** Fusion des parts (les traits de coupe s'effacent), en ms. */
	REGROUP_MS: 650,
	/** Affichage des groupes impossibles (« il en reste 2 »), en ms. */
	REGROUP_FAIL_MS: 1800,

	/** Étoiles selon le nombre de services ratés dans le niveau. */
	STARS_3_MAX_ERRORS: 0,
	STARS_2_MAX_ERRORS: 2,

	/** Niveaux réussis dans un monde pour ouvrir le monde suivant. */
	WORLD_UNLOCK_COUNT: 6
} as const;
