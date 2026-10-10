<script lang="ts">
	interface Props {
		count: number;
		max?: number;
		size?: number;
	}

	let { count, max = 3, size = 28 }: Props = $props();
</script>

<span class="stars" role="img" aria-label="{count} étoile{count > 1 ? 's' : ''} sur {max}">
	{#each Array(max) as _, i (i)}
		<svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
			<path
				d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8z"
				class:on={i < count}
			/>
		</svg>
	{/each}
</span>

<style>
	.stars {
		display: inline-flex;
		gap: 2px;
	}
	path {
		fill: var(--card);
		stroke: var(--ink);
		stroke-width: 1.8;
		stroke-linejoin: round;
		stroke-dasharray: 3 2;
	}
	path.on {
		fill: var(--cheese);
		stroke-dasharray: none;
	}
</style>
