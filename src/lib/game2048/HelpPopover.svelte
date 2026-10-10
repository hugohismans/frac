<script lang="ts">
	import FractionBar from '../components/FractionBar.svelte';
	import FractionLabel from '../components/FractionLabel.svelte';
	import Pizza from '../components/Pizza.svelte';
	import type { Fraction } from '../fraction';
	import { fractionWords } from '../fractionWords';

	interface Props {
		value: Fraction;
	}

	let { value }: Props = $props();

	/** Une pizza par entier commencé : 12/8 donne une pizza pleine et une à moitié. */
	const pizzas = $derived(
		Array.from({ length: Math.max(1, Math.ceil(value.n / value.d)) }, (_, i) =>
			Math.min(value.d, Math.max(0, value.n - i * value.d))
		)
	);
	const pizzaSize = $derived(pizzas.length === 1 ? 140 : pizzas.length === 2 ? 110 : 80);
</script>

<div class="help" role="status">
	<div class="title">
		<FractionLabel {value} size={26} decorative />
		<span>{fractionWords(value)}</span>
	</div>
	<div class="pizzas">
		{#each pizzas as filled, i (i)}
			<Pizza parts={value.d} {filled} size={pizzaSize} />
		{/each}
	</div>
	<FractionBar {value} width={220} height={28} />
</div>

<style>
	.help {
		position: absolute;
		inset: 6%;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 12px;
		border: 3px solid var(--ink);
		border-radius: 24px;
		background: var(--card);
		box-shadow: 0 6px 0 var(--ink);
		pointer-events: none;
		animation: appear 140ms ease-out;
	}
	.title {
		display: flex;
		align-items: center;
		gap: 12px;
		font-weight: 800;
		font-size: 1.1rem;
	}
	.pizzas {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
	}
	@keyframes appear {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.help {
			animation: none;
		}
	}
</style>
