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
	tap: 6
} as const satisfies Record<string, number | readonly number[] | boolean>;

// ---------------------------------------------------------------------------
// Fraction 2048
// ---------------------------------------------------------------------------

export const G2048 = {
	SIZE: 4,
	START_TILES: 2,

	/** Durée du glissement des tuiles, en ms. */
	SLIDE_MS: 110,
	/** Durée du « pop » d'une tuile fusionnée ou nouvelle, en ms. */
	POP_MS: 180,
	/** Durée de l'animation de simplification (÷k), en ms. */
	SIMPLIFY_MS: 320,
	/** Écart entre les tuiles, en px. */
	TILE_GAP_PX: 8,
	/** Largeur maximale du plateau, en px. */
	BOARD_MAX_PX: 460,

	/**
	 * Valeurs qui apparaissent (en seizièmes : 1 = 1/16, 2 = 1/8, 4 = 1/4) et leur poids.
	 * Toutes les valeurs du jeu sont de la forme 2^k/16, donc tout peut mener à 1.
	 */
	SPAWN_VALUE_WEIGHTS: [
		{ sixteenths: 1, weight: 30 },
		{ sixteenths: 2, weight: 45 },
		{ sixteenths: 4, weight: 25 }
	],
	/** Écritures possibles pour chaque valeur (en seizièmes). La première est l'irréductible. */
	SPAWN_FORMS: {
		1: ['1/16'],
		2: ['1/8', '2/16'],
		4: ['1/4', '2/8', '3/12', '4/16'],
		8: ['1/2', '2/4', '4/8', '6/12', '8/16']
	} as Record<number, string[]>,
	/** Probabilité qu'une nouvelle tuile apparaisse sous une forme non simplifiée (si possible). */
	SPAWN_UNSIMPLIFIED_P: 0.6,

	/**
	 * Une fusion écrit le résultat sur le plus petit dénominateur commun.
	 * S'il dépasse ce plafond (ex. 12 et 8 donnent 24), on garde le plus grand des deux
	 * (3/12 + 2/8 = 6/12).
	 */
	MAX_DENOMINATOR: 16,

	/** Points d'une fusion = valeur du résultat en seizièmes x ce facteur (1 entier = 160). */
	MERGE_POINTS_PER_SIXTEENTH: 10,
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

	/** Valeurs entières qui déclenchent une petite fête (en plus du premier 1). */
	MILESTONES: [2, 4, 8, 16],

	/** Options d'aide par défaut. */
	HELP_LONG_PRESS_DEFAULT: true,
	HELP_COLOR_BY_VALUE_DEFAULT: false
} as const;
