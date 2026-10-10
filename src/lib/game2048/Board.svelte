<script lang="ts">
	import { gestures } from '../gestures';
	import { motion } from '../motion.svelte';
	import { prefs } from '../prefs.svelte';
	import { G2048 } from '../settings';
	import type { Game2048 } from './game.svelte';
	import { tileColor } from './colors';
	import HelpPopover from './HelpPopover.svelte';
	import Tile from './Tile.svelte';

	interface Props {
		game: Game2048;
	}

	let { game }: Props = $props();

	let width = $state(320);
	const size = $derived(game.rules.size);
	const gap = $derived(Math.max(4, G2048.TILE_GAP_PX - Math.max(0, size - 4) * 2));
	const cellPx = $derived((width - gap * (size + 1)) / size);
	const fontPx = $derived(Math.max(13, Math.round(cellPx * 0.3)));

	function tileId(el: HTMLElement | null): number | null {
		const raw = el?.dataset.tileId;
		return raw ? Number(raw) : null;
	}
</script>

<div
	class="board"
	bind:clientWidth={width}
	style:--gap="{gap}px"
	style:--cell="calc((100% - {gap * (size + 1)}px) / {size})"
	style:--radius="{Math.round(cellPx * 0.2)}px"
	style:--slide-ms="{motion.ms(G2048.SLIDE_MS)}ms"
	style:--pop-ms="{motion.ms(G2048.POP_MS) || 160}ms"
	style:--simplify-ms="{motion.ms(G2048.SIMPLIFY_MS) || 160}ms"
	role="grid"
	aria-label="Plateau de jeu. Glisse ou utilise les flèches pour déplacer les tuiles."
	{@attach gestures({
		onswipe: (dir) => game.move(dir),
		ontap: (el) => game.tap(tileId(el)),
		onlongpress: (el) => {
			const id = tileId(el);
			if (prefs.helpLongPress && id !== null) game.showHelp(id);
		},
		onrelease: () => game.hideHelp()
	})}
>
	{#each Array(size * size) as _, i (i)}
		<div
			class="cell"
			style:--row={Math.floor(i / size)}
			style:--col={i % size}
			aria-hidden="true"
		></div>
	{/each}

	{#each game.tiles as tile (tile.id)}
		<Tile
			{tile}
			{fontPx}
			selected={tile.id === game.selectedId}
			shaking={tile.id === game.shakeId}
			color={tileColor(tile.value, prefs.helpColorByValue, game.rules)}
			need={game.countFor(tile.value)}
			onkeyboardtap={(id) => game.tap(id)}
		/>
	{/each}

	{#if game.helpTile}
		<HelpPopover value={game.helpTile.value} />
	{/if}
</div>

<style>
	.board {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		border: 3px solid var(--ink);
		border-radius: 22px;
		background: var(--crust);
		box-shadow: 0 5px 0 var(--ink);
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		overscroll-behavior: contain;
	}
	.cell {
		position: absolute;
		left: var(--gap);
		top: var(--gap);
		width: var(--cell);
		height: var(--cell);
		transform: translate(
			calc(var(--col) * (100% + var(--gap))),
			calc(var(--row) * (100% + var(--gap)))
		);
		border-radius: var(--radius);
		background: rgba(255, 250, 242, 0.55);
		border: 2px dashed rgba(107, 58, 22, 0.35);
	}
</style>
