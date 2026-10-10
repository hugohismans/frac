<script lang="ts">
	import type { Fraction } from '../fraction';
	import { fractionWords } from '../fractionWords';

	interface Props {
		value: Fraction;
		/** Taille des chiffres, en px. */
		size?: number;
		/** Masquer la lecture vocale (si un parent la donne déjà). */
		decorative?: boolean;
	}

	let { value, size = 28, decorative = false }: Props = $props();

	const isWhole = $derived(value.d === 1);
	const digits = $derived(Math.max(String(value.n).length, String(value.d).length));
</script>

<span
	class="fraction"
	style:--fs="{size}px"
	style:--digits={digits}
	role={decorative ? undefined : 'img'}
	aria-hidden={decorative ? 'true' : undefined}
	aria-label={decorative ? undefined : fractionWords(value)}
>
	{#if isWhole}
		<span class="whole">{value.n}</span>
	{:else}
		<span class="num">{value.n}</span>
		<span class="bar"></span>
		<span class="den">{value.d}</span>
	{/if}
</span>

<style>
	.fraction {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-size: var(--fs);
		font-weight: 800;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		color: inherit;
	}
	.num,
	.den {
		display: block;
		padding: 0 0.12em;
	}
	.bar {
		display: block;
		width: calc(var(--digits) * 0.62em + 0.35em);
		height: max(2px, calc(var(--fs) * 0.1));
		margin: 0.12em 0;
		border-radius: 999px;
		background: currentColor;
	}
	.whole {
		font-size: 1.5em;
	}
</style>
