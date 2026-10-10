<script lang="ts">
	import Pizza from '../components/Pizza.svelte';

	interface Props {
		choices: number[];
		onpick: (k: number) => void;
	}

	let { choices, onpick }: Props = $props();
</script>

<div class="picker" role="group" aria-label="En combien de parts couper la pizza ?">
	{#each choices as k (k)}
		<button type="button" onclick={() => onpick(k)} aria-label="Couper en {k} parts">
			<Pizza parts={k} size={44} />
			<span><strong>{k}</strong> parts</span>
		</button>
	{/each}
</div>

<style>
	.picker {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
	}
	button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		min-width: 72px;
		padding: 6px 8px;
		border: 3px solid var(--ink);
		border-radius: 16px;
		background: var(--card);
		color: var(--ink);
		font: inherit;
		font-weight: 700;
		font-size: 0.9rem;
		box-shadow: 0 3px 0 var(--ink);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	button:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--ink);
	}
	button:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}
	strong {
		font-size: 1.15rem;
	}
</style>
