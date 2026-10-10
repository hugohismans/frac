<script lang="ts">
	import FractionLabel from '../components/FractionLabel.svelte';
	import type { Fraction } from '../fraction';

	interface Props {
		value: Fraction;
		choices: number[];
		rejected: number[];
		onpick: (k: number) => void;
		onclose: () => void;
	}

	let { value, choices, rejected, onpick, onclose }: Props = $props();
</script>

<div class="picker" role="group" aria-label="Simplifier la tuile">
	<div class="top">
		<span class="current">
			<FractionLabel {value} size={20} />
			<span>Divise haut et bas par :</span>
		</span>
		<button type="button" class="close" aria-label="Annuler la sélection" onclick={onclose}>
			<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"
				><path d="M6 6l12 12M18 6L6 18" /></svg
			>
		</button>
	</div>
	<div class="choices">
		{#each choices as k (k)}
			{@const no = rejected.includes(k)}
			<button
				type="button"
				class="choice"
				class:no
				disabled={no}
				aria-label={no ? `Diviser par ${k} : impossible` : `Diviser par ${k}`}
				onclick={() => onpick(k)}
			>
				÷{k}
				{#if no}<span class="cross" aria-hidden="true"></span>{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
		padding: 4px 10px 10px 14px;
		border: 3px solid var(--ink);
		border-radius: 22px;
		background: var(--card);
		box-shadow: 0 4px 0 var(--ink);
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.current {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 700;
		font-size: 0.95rem;
	}
	.choices {
		display: flex;
		gap: 8px;
	}
	.choice {
		position: relative;
		flex: 1;
		min-width: 48px;
		max-width: 96px;
		height: 48px;
		border: 3px solid var(--ink);
		border-radius: 14px;
		background: var(--cheese);
		color: var(--ink);
		font: inherit;
		font-size: 1.3rem;
		font-weight: 800;
		box-shadow: 0 3px 0 var(--ink);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	.choice:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--ink);
	}
	.choice:focus-visible,
	.close:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}
	.choice.no {
		background: var(--plate);
		color: var(--ink-soft);
		border-style: dashed;
		box-shadow: none;
		cursor: default;
	}
	.cross {
		position: absolute;
		inset: 8px;
		background:
			linear-gradient(45deg, transparent 45%, var(--ink) 45% 55%, transparent 55%),
			linear-gradient(-45deg, transparent 45%, var(--ink) 45% 55%, transparent 55%);
		opacity: 0.7;
	}
	.close {
		flex: none;
		margin-right: -6px;
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border: none;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
	}
	.close path {
		stroke: var(--ink);
		stroke-width: 3;
		stroke-linecap: round;
	}
</style>
