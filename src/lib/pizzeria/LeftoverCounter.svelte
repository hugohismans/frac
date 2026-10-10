<script lang="ts" module>
	import type { Topping } from '../components/Pizza.svelte';

	/** Garniture de chaque reste, dans l'ordre du comptoir. */
	export const LEFTOVER_TOPPINGS: Topping[] = ['pepperoni', 'olive', 'basil'];
	const TOPPING_NAMES: Record<Topping, string> = {
		pepperoni: 'au pepperoni',
		olive: 'aux olives',
		basil: 'au basilic'
	};
	export const toppingName = (t: Topping) => TOPPING_NAMES[t];
</script>

<script lang="ts">
	import FractionLabel from '../components/FractionLabel.svelte';
	import Pizza from '../components/Pizza.svelte';
	import type { Fraction } from '../fraction';
	import { fractionWords } from '../fractionWords';

	interface Props {
		leftovers: Fraction[];
		onPlate: boolean[];
		disabled: boolean;
		ontoggle: (i: number) => void;
	}

	let { leftovers, onPlate, disabled, ontoggle }: Props = $props();
</script>

<div class="counter" role="group" aria-label="Les restes sur le comptoir">
	{#each leftovers as piece, i (i)}
		{@const topping = LEFTOVER_TOPPINGS[i % LEFTOVER_TOPPINGS.length]}
		<button
			type="button"
			class="leftover"
			class:used={onPlate[i]}
			aria-pressed={onPlate[i]}
			aria-label="Reste {toppingName(topping)} : {fractionWords(piece)}{onPlate[i]
				? ', sur le plateau'
				: ''}"
			{disabled}
			onclick={() => ontoggle(i)}
		>
			<span class="thumb">
				<Pizza parts={piece.d} filled={onPlate[i] ? 0 : piece.n} size={42} {topping} />
				{#if onPlate[i]}
					<svg class="check" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
						><circle cx="12" cy="12" r="11" /><path d="M6.5 12.5l3.5 3.5 7.5-8" /></svg
					>
				{/if}
			</span>
			<FractionLabel value={piece} size={16} decorative />
		</button>
	{/each}
</div>

<style>
	.counter {
		display: flex;
		justify-content: center;
		gap: 10px;
		width: 100%;
	}
	.leftover {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 52px;
		padding: 4px 10px;
		border: 3px solid var(--ink);
		border-radius: 16px;
		background: var(--card);
		color: var(--ink);
		font: inherit;
		box-shadow: 0 3px 0 var(--ink);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	.leftover:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--ink);
	}
	.leftover:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}
	.leftover.used {
		border-style: dashed;
		background: var(--plate);
		box-shadow: none;
	}
	.thumb {
		position: relative;
		line-height: 0;
	}
	.check {
		position: absolute;
		right: -6px;
		bottom: -4px;
	}
	.check circle {
		fill: var(--basil);
	}
	.check path {
		fill: none;
		stroke: #fff;
		stroke-width: 2.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
