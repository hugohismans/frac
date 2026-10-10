<script lang="ts">
	import FractionLabel from '../components/FractionLabel.svelte';
	import Pizza from '../components/Pizza.svelte';
	import { fractionWords } from '../fractionWords';
	import type { TileView } from './game.svelte';

	interface Props {
		tile: TileView;
		fontPx: number;
		selected: boolean;
		shaking: boolean;
		color: string;
		/** Nombre de tuiles égales à réunir pour fusionner (affiché s'il vaut 3 ou plus). */
		need: number;
		onkeyboardtap: (id: number) => void;
	}

	let { tile, fontPx, selected, shaking, color, need, onkeyboardtap }: Props = $props();

	const isWholeOne = $derived(tile.value.d === 1);
</script>

<div
	class="tile {tile.state}"
	class:selected
	style:--cell-font="{fontPx}px"
	style:--row={tile.row}
	style:--col={tile.col}
	style:--bg={color}
>
	{#if tile.state === 'ghost'}
		<div class="face" aria-hidden="true">
			<FractionLabel value={tile.value} size={fontPx} decorative />
		</div>
	{:else}
		<button
			class="face"
			class:shake={shaking}
			type="button"
			data-gesture-target
			data-tile-id={tile.id}
			aria-label={fractionWords(tile.value) +
				(need > 2 ? `, il en faut ${need} pour fusionner` : '')}
			aria-pressed={selected}
			onclick={(e) => {
				// Les taps tactiles et souris passent par les gestes du plateau ; ici, seulement le clavier.
				if (e.detail === 0) onkeyboardtap(tile.id);
			}}
		>
			{#if isWholeOne}
				<span class="whole-icon" aria-hidden="true"><Pizza parts={1} size={fontPx * 1.1} /></span>
			{/if}
			<FractionLabel
				value={tile.value}
				size={(isWholeOne ? fontPx * 0.9 : fontPx) * (need > 2 ? 0.86 : 1)}
				decorative
			/>
			{#if need > 2}
				<span class="need" aria-hidden="true">
					{#each Array(need) as _, i (i)}<span class="dot"></span>{/each}
				</span>
			{/if}
			{#if tile.state === 'simplified' && tile.divisor}
				<span class="div-badge top" aria-hidden="true">÷{tile.divisor}</span>
				<span class="div-badge bottom" aria-hidden="true">÷{tile.divisor}</span>
			{/if}
		</button>
	{/if}
</div>

<style>
	.tile {
		position: absolute;
		left: var(--gap);
		top: var(--gap);
		width: var(--cell);
		height: var(--cell);
		transform: translate(
			calc(var(--col) * (100% + var(--gap))),
			calc(var(--row) * (100% + var(--gap)))
		);
		transition: transform var(--slide-ms) ease-out;
		z-index: 2;
	}
	.tile.ghost {
		z-index: 1;
	}
	.tile.selected {
		z-index: 3;
	}
	.face {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 3px solid var(--ink);
		border-radius: var(--radius);
		background: var(--bg);
		color: var(--ink);
		font: inherit;
		box-shadow: 0 4px 0 var(--ink);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			transform 120ms ease-out,
			box-shadow 120ms ease-out;
	}
	.face:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}
	.selected .face {
		transform: translateY(-4px) scale(1.04);
		box-shadow:
			0 0 0 4px var(--card),
			0 0 0 8px var(--ink),
			0 8px 0 4px var(--ink);
	}
	.new .face {
		animation: pop var(--pop-ms) ease-out backwards;
	}
	.merged .face {
		animation: merge var(--pop-ms) ease-out backwards;
		animation-delay: var(--slide-ms);
	}
	.simplified .face {
		animation: squish var(--simplify-ms) ease-out;
	}
	.shake {
		animation: shake 360ms ease-in-out;
	}
	.need {
		display: flex;
		gap: max(2px, calc(var(--cell-font) * 0.12));
	}
	.dot {
		width: max(4px, calc(var(--cell-font) * 0.26));
		height: max(4px, calc(var(--cell-font) * 0.26));
		border-radius: 50%;
		background: var(--ink);
	}
	.whole-icon {
		display: block;
		line-height: 0;
	}
	.div-badge {
		position: absolute;
		right: -6px;
		padding: 1px 6px;
		border: 2px solid var(--ink);
		border-radius: 999px;
		background: var(--card);
		font-size: 0.8rem;
		font-weight: 800;
		animation: badge var(--simplify-ms) ease-out forwards;
		pointer-events: none;
	}
	.div-badge.top {
		top: 6%;
	}
	.div-badge.bottom {
		bottom: 6%;
	}

	@keyframes pop {
		0% {
			transform: scale(0);
		}
		70% {
			transform: scale(1.08);
		}
		100% {
			transform: scale(1);
		}
	}
	@keyframes merge {
		0% {
			transform: scale(0.6);
		}
		60% {
			transform: scale(1.18);
		}
		100% {
			transform: scale(1);
		}
	}
	@keyframes squish {
		0% {
			transform: scale(1.15, 0.8);
		}
		50% {
			transform: scale(0.92, 1.1);
		}
		100% {
			transform: scale(1);
		}
	}
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20% {
			transform: translateX(-6px) rotate(-3deg);
		}
		40% {
			transform: translateX(6px) rotate(3deg);
		}
		60% {
			transform: translateX(-4px);
		}
		80% {
			transform: translateX(4px);
		}
	}
	@keyframes badge {
		0% {
			opacity: 0;
			transform: scale(0.5);
		}
		25% {
			opacity: 1;
			transform: scale(1.1);
		}
		75% {
			opacity: 1;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: translateY(-6px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tile {
			transition: none;
		}
		.new .face,
		.merged .face,
		.simplified .face,
		.shake {
			animation: fade 160ms ease-out backwards;
		}
		.selected .face {
			transform: none;
		}
		.div-badge {
			animation: none;
			opacity: 0;
		}
		@keyframes fade {
			from {
				opacity: 0;
			}
		}
	}
</style>
