<script lang="ts" module>
	export interface SliceGeometry {
		path: string;
		innerPath: string;
		cheesePath: string;
		mid: number;
		span: number;
	}

	const C = 50;
	const R = 46;
	const R_SAUCE = 39;
	const R_CHEESE = 36;

	function polar(r: number, angle: number): [number, number] {
		return [C + r * Math.cos(angle), C + r * Math.sin(angle)];
	}

	export function sector(r: number, a0: number, a1: number): string {
		if (a1 - a0 >= Math.PI * 2 - 1e-9) {
			return `M ${C - r} ${C} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
		}
		const [x0, y0] = polar(r, a0);
		const [x1, y1] = polar(r, a1);
		const large = a1 - a0 > Math.PI ? 1 : 0;
		return `M ${C} ${C} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
	}

	/** Géométrie des parts : la première part commence en haut, puis on tourne dans le sens horaire. */
	export function slices(count: number): SliceGeometry[] {
		const span = (Math.PI * 2) / count;
		return Array.from({ length: count }, (_, i) => {
			const a0 = -Math.PI / 2 + i * span;
			const a1 = a0 + span;
			return {
				path: sector(R, a0, a1),
				innerPath: sector(R_SAUCE, a0, a1),
				cheesePath: sector(R_CHEESE, a0, a1),
				mid: a0 + span / 2,
				span
			};
		});
	}

	/** Positions des rondelles de pepperoni dans une part. */
	export function pepperoni(slice: SliceGeometry): { x: number; y: number; r: number }[] {
		let spots: [number, number][];
		if (slice.span > 6) {
			// Pizza entière : une couronne et une rondelle au centre.
			spots = [
				[0, 0],
				...[0, 1, 2, 3, 4].map((k): [number, number] => [0.62, (k / 5 - 0.5) * 0.98])
			];
		} else if (slice.span > 2) {
			// Moitié ou tiers.
			spots = [
				[0.68, 0],
				[0.5, -0.28],
				[0.5, 0.28],
				[0.26, 0]
			];
		} else if (slice.span > 1.2) {
			spots = [
				[0.66, 0],
				[0.42, -0.25],
				[0.42, 0.25]
			];
		} else if (slice.span > 0.6) {
			spots = [
				[0.68, 0],
				[0.4, 0]
			];
		} else {
			spots = [[0.66, 0]];
		}
		const size = slice.span > 1.2 ? 5.5 : slice.span > 0.6 ? 5 : 4;
		return spots.map(([radius, offset]) => {
			const [x, y] = polar(R_CHEESE * radius, slice.mid + offset * slice.span);
			return { x, y, r: size };
		});
	}
</script>

<script lang="ts">
	interface Props {
		/** Nombre de parts. */
		parts: number;
		/** Nombre de parts garnies (les premières), ou état de chaque part. */
		filled?: number | readonly boolean[];
		/** Taille en px. */
		size?: number;
		/** Texte pour les lecteurs d'écran. */
		label?: string;
		/** Parts mises en évidence (contour épais). */
		highlighted?: readonly boolean[];
		/** Parts choisies : elles ressortent de la pizza avec un contour épais. */
		selected?: readonly boolean[];
		/** Regroupement par k en cours : les traits de coupe intérieurs aux groupes s'effacent. */
		fadingCuts?: number | null;
		/**
		 * Montre des paquets de k parts parmi les `count` premières ; les parts qui restent
		 * sont barrées (regroupement impossible).
		 */
		groups?: { k: number; count: number } | null;
	}

	let {
		parts,
		filled = parts,
		size = 120,
		label,
		highlighted,
		selected,
		fadingCuts = null,
		groups = null
	}: Props = $props();

	const uid = $props.id();
	const geometry = $derived(slices(parts));
	const isFilled = (i: number) => (typeof filled === 'number' ? i < filled : !!filled[i]);
	const span = $derived((Math.PI * 2) / parts);
	const start = -Math.PI / 2;

	/** Décalage vers l'extérieur d'une part choisie. */
	function pull(i: number): string {
		if (!selected?.[i] || parts === 1) return 'translate(0px, 0px)';
		const mid = geometry[i].mid;
		return `translate(${(4 * Math.cos(mid)).toFixed(2)}px, ${(4 * Math.sin(mid)).toFixed(2)}px)`;
	}

	const groupShapes = $derived.by(() => {
		if (!groups || groups.k < 1) return { full: [] as string[], leftover: [] as string[] };
		const complete = Math.floor(groups.count / groups.k);
		const full = Array.from({ length: complete }, (_, g) =>
			sector(46, start + g * groups.k * span, start + (g + 1) * groups.k * span)
		);
		const leftover = Array.from({ length: groups.count - complete * groups.k }, (_, j) => {
			const i = complete * groups.k + j;
			return sector(46, start + i * span, start + (i + 1) * span);
		});
		return { full, leftover };
	});
</script>

<svg
	class="pizza"
	viewBox="0 0 100 100"
	width={size}
	height={size}
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	<defs>
		<pattern
			id="left-{uid}"
			width="5"
			height="5"
			patternUnits="userSpaceOnUse"
			patternTransform="rotate(45)"
		>
			<rect width="5" height="5" fill="#fff4f2" />
			<line x1="0" y1="0" x2="0" y2="5" stroke="#c7372a" stroke-width="2" />
		</pattern>
	</defs>
	<circle cx="50" cy="50" r="48.5" class="plate" />
	{#each geometry as slice, i (i)}
		{@const on = isFilled(i)}
		<g class="slice" class:on style:transform={pull(i)}>
			{#if on}
				<path d={slice.path} class="crust" />
				<path d={slice.innerPath} class="sauce" />
				<path d={slice.cheesePath} class="cheese" />
				{#each pepperoni(slice) as p, j (j)}
					<circle cx={p.x} cy={p.y} r={p.r} class="pep" />
					<circle cx={p.x - p.r * 0.3} cy={p.y - p.r * 0.3} r={p.r * 0.25} class="pep-spot" />
				{/each}
			{:else}
				<path d={slice.path} class="empty" />
			{/if}
			{#if selected?.[i]}
				<path d={slice.path} class="sel-outline" />
			{/if}
		</g>
	{/each}
	{#if parts > 1}
		{#each geometry as slice, i (i)}
			{@const a = slice.mid - slice.span / 2}
			<line
				x1="50"
				y1="50"
				x2={50 + 47 * Math.cos(a)}
				y2={50 + 47 * Math.sin(a)}
				class="cut"
				class:fade={fadingCuts !== null && i % fadingCuts !== 0}
			/>
		{/each}
	{/if}
	{#each geometry as slice, i (i)}
		{#if highlighted?.[i]}
			<path d={slice.path} class="hl-outline" />
		{/if}
	{/each}
	{#each groupShapes.full as d, g (g)}
		<path {d} class="group" />
	{/each}
	{#each groupShapes.leftover as d, g (g)}
		<path {d} class="leftover" fill="url(#left-{uid})" />
	{/each}
</svg>

<style>
	.pizza {
		display: block;
		overflow: visible;
	}
	.plate {
		fill: var(--plate, #fffaf2);
		stroke: var(--plate-edge, #d9c3a5);
		stroke-width: 1.5;
	}
	.empty {
		fill: var(--plate, #fffaf2);
		stroke: #b89b78;
		stroke-width: 1;
		stroke-dasharray: 3 2.5;
	}
	.crust {
		fill: #e3a04f;
	}
	.sauce {
		fill: #e4572e;
	}
	.cheese {
		fill: #ffcf4d;
	}
	.pep {
		fill: #b8322a;
	}
	.pep-spot {
		fill: #e06a55;
	}
	.cut {
		stroke: #6b3a16;
		stroke-width: 1.4;
		stroke-linecap: round;
		transition: opacity var(--regroup-ms, 600ms) ease-in-out;
	}
	.cut.fade {
		opacity: 0;
	}
	.slice {
		transition: transform 140ms ease-out;
	}
	.sel-outline {
		fill: none;
		stroke: var(--ink, #2b2118);
		stroke-width: 2.6;
		stroke-linejoin: round;
	}
	.group {
		fill: none;
		stroke: var(--ink, #2b2118);
		stroke-width: 2.4;
		stroke-dasharray: 4 2.5;
		stroke-linejoin: round;
	}
	.leftover {
		stroke: #c7372a;
		stroke-width: 2.4;
		stroke-dasharray: 3 2;
		opacity: 0.9;
	}
	@media (prefers-reduced-motion: reduce) {
		.cut,
		.slice {
			transition: none;
		}
	}
	.hl-outline {
		fill: none;
		stroke: var(--ink, #2b2118);
		stroke-width: 3;
		stroke-linejoin: round;
	}
</style>
