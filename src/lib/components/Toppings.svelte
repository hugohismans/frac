<script lang="ts">
	import { pepperoni, type SliceGeometry, type Topping } from './Pizza.svelte';

	interface Props {
		slice: SliceGeometry;
		kind?: Topping;
	}

	let { slice, kind = 'pepperoni' }: Props = $props();

	const spots = $derived(pepperoni(slice));
</script>

{#each spots as p, j (j)}
	{#if kind === 'olive'}
		<circle cx={p.x} cy={p.y} r={p.r * 0.85} class="olive" />
		<circle cx={p.x} cy={p.y} r={p.r * 0.35} class="olive-hole" />
	{:else if kind === 'basil'}
		<ellipse
			cx={p.x}
			cy={p.y}
			rx={p.r * 1.15}
			ry={p.r * 0.6}
			transform="rotate({(slice.mid * 180) / Math.PI + 35 * (j % 2 ? 1 : -1)} {p.x} {p.y})"
			class="basil"
		/>
	{:else}
		<circle cx={p.x} cy={p.y} r={p.r} class="pep" />
		<circle cx={p.x - p.r * 0.3} cy={p.y - p.r * 0.3} r={p.r * 0.25} class="pep-spot" />
	{/if}
{/each}

<style>
	.pep {
		fill: #b8322a;
	}
	.pep-spot {
		fill: #e06a55;
	}
	.olive {
		fill: #2b2118;
	}
	.olive-hole {
		fill: #ffcf4d;
	}
	.basil {
		fill: #2f8a4c;
		stroke: #1d5a31;
		stroke-width: 0.8;
	}
</style>
