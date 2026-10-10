<script lang="ts">
	import Pizza from '../components/Pizza.svelte';

	interface Props {
		parts: number;
		size: number;
		filled?: number;
		selected?: boolean[];
		fadingCuts?: number | null;
		groups?: { k: number; count: number } | null;
		/** Rend les parts sélectionnables. */
		onslice?: (index: number) => void;
		label: string;
	}

	let {
		parts,
		size,
		filled = parts,
		selected,
		fadingCuts = null,
		groups = null,
		onslice,
		label
	}: Props = $props();

	let el: HTMLDivElement | undefined = $state();

	/** Trouve la part touchée à partir de l'angle du doigt par rapport au centre. */
	function hit(e: MouseEvent) {
		if (!onslice || !el || e.detail === 0) return;
		const rect = el.getBoundingClientRect();
		const dx = e.clientX - (rect.left + rect.width / 2);
		const dy = e.clientY - (rect.top + rect.height / 2);
		if (Math.hypot(dx, dy) > rect.width / 2) return;
		const angle = (Math.atan2(dy, dx) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
		onslice(Math.min(parts - 1, Math.floor(angle / ((Math.PI * 2) / parts))));
	}
</script>

<!-- Les taps passent par l'angle du doigt ; les boutons cachés servent au clavier et aux lecteurs d'écran. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="board"
	class:interactive={!!onslice}
	bind:this={el}
	onclick={hit}
	style:width="{size}px"
	style:height="{size}px"
>
	<Pizza {parts} {filled} {size} {selected} {fadingCuts} {groups} {label} />
	{#if onslice && selected}
		<div class="visually-hidden">
			{#each selected as on, i (i)}
				<button
					type="button"
					aria-pressed={on}
					onclick={(e) => {
						e.stopPropagation();
						onslice(i);
					}}>Part {i + 1} sur {parts}</button
				>
			{/each}
		</div>
	{/if}
</div>

<style>
	.board {
		position: relative;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	.interactive {
		cursor: pointer;
	}
</style>
