import { error } from '@sveltejs/kit';
import { allLevels, findLevel } from '#lib/pizzeria/levels.js';
import type { EntryGenerator, PageLoad } from './$types';

// La progression vit dans localStorage : rendu côté navigateur uniquement.
export const ssr = false;

export const entries: EntryGenerator = () =>
	allLevels().map((l) => ({ world: String(l.world), level: String(l.index) }));

export const load: PageLoad = ({ params }) => {
	const level = findLevel(Number(params.world), Number(params.level));
	if (!level) error(404, 'Ce niveau n’existe pas.');
	return { level };
};
