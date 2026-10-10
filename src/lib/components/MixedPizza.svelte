<script lang="ts">
	/**
	 * Une pizza faite de restes posés les uns à côté des autres, chacun avec sa propre découpe.
	 * Monde 4 : on voit que 1/2 et 1/4 ne sont pas coupés pareil, et qu'il faut recouper pour compter.
	 */
	import type { Fraction } from '../fraction';
	import { sector, sliceAt, type Topping } from './Pizza.svelte';
	import Toppings from './Toppings.svelte';

	export interface Piece {
		value: Fraction;
		topping: Topping;
		/** Ce reste ne peut pas être recoupé comme demandé : il est barré. */
		failing?: boolean;
	}

	interface Props {
		pieces: Piece[];
		size: number;
		label: string;
	}

	let { pieces, size, label }: Props = $props();

	const uid = $props.id();
	const TAU = Math.PI * 2;
	const START = -Math.PI / 2;

	const layout = $derived.by(() => {
		let cursor = START;
		const slices: { a0: number; a1: number; topping: Topping }[] = [];
		const borders: number[] = [];
		const failing: string[] = [];
		for (const piece of pieces) {
			const span = TAU / piece.value.d;
			const begin = cursor;
			borders.push(begin);
			for (let i = 0; i < piece.value.n; i++) {
				slices.push({ a0: cursor, a1: cursor + span, topping: piece.topping });
				cursor += span;
			}
			if (piece.failing) failing.push(sector(46, begin, cursor));
		}
		if (pieces.length > 0) borders.push(cursor);
		return { slices, borders, failing, end: cursor };
	});
</script>

<svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label}>
	<defs>
		<pattern
			id="no-{uid}"
			width="5"
			height="5"
			patternUnits="userSpaceOnUse"
			patternTransform="rotate(45)"
		>
			<rect width="5" height="5" fill="rgba(255,244,242,0.75)" />
			<line x1="0" y1="0" x2="0" y2="5" stroke="#c7372a" stroke-width="2" />
		</pattern>
	</defs>
	<circle cx="50" cy="50" r="48.5" class="plate" />
	{#if layout.end < START + TAU - 1e-6}
		<path d={sector(46, layout.end, START + TAU)} class="empty" />
	{/if}
	{#each layout.slices as s, i (i)}
		{@const slice = sliceAt(s.a0, s.a1)}
		<path d={slice.path} class="crust" />
		<path d={slice.innerPath} class="sauce" />
		<path d={slice.cheesePath} class="cheese" />
		<Toppings {slice} kind={s.topping} />
	{/each}
	{#each layout.slices as s, i (i)}
		<line x1="50" y1="50" x2={50 + 47 * Math.cos(s.a0)} y2={50 + 47 * Math.sin(s.a0)} class="cut" />
	{/each}
	{#each layout.borders as a, i (i)}
		<line x1="50" y1="50" x2={50 + 48 * Math.cos(a)} y2={50 + 48 * Math.sin(a)} class="border" />
	{/each}
	{#each layout.failing as d, i (i)}
		<path {d} fill="url(#no-{uid})" class="failing" />
	{/each}
</svg>

<style>
	svg {
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
	.cut {
		stroke: #6b3a16;
		stroke-width: 1.4;
		stroke-linecap: round;
	}
	.border {
		stroke: var(--ink, #2b2118);
		stroke-width: 2.6;
		stroke-linecap: round;
	}
	.failing {
		stroke: #c7372a;
		stroke-width: 2.4;
		stroke-dasharray: 3 2;
	}
</style>
