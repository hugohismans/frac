import { G2048, HAPTICS } from './settings';
import { load, save } from './storage';

export interface Prefs {
	haptics: boolean;
	/** 2048 : un appui long sur une tuile montre sa pizza et sa barre. */
	helpLongPress: boolean;
	/** 2048 : les tuiles de même valeur ont la même couleur. */
	helpColorByValue: boolean;
}

const KEY = 'prefs';
const VERSION = 1;

const defaults: Prefs = {
	haptics: HAPTICS.ENABLED_BY_DEFAULT,
	helpLongPress: G2048.HELP_LONG_PRESS_DEFAULT,
	helpColorByValue: G2048.HELP_COLOR_BY_VALUE_DEFAULT
};

export const prefs: Prefs = $state({ ...defaults, ...load<Partial<Prefs>>(KEY, VERSION, {}) });

export function savePrefs(): void {
	save(KEY, VERSION, { ...prefs });
}
