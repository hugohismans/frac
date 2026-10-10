<script lang="ts">
	interface Props {
		tone: 'good' | 'info' | 'oops';
		text: string;
	}

	let { tone, text }: Props = $props();
</script>

<div class="feedback {tone}">
	<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
		<circle cx="12" cy="12" r="11" class="disc" />
		{#if tone === 'good'}
			<path d="M6.5 12.5l3.5 3.5 7.5-8" class="mark" />
		{:else if tone === 'oops'}
			<path d="M8 8l8 8M16 8l-8 8" class="mark" />
		{:else}
			<path d="M12 11v6M12 7.2v.1" class="mark" />
		{/if}
	</svg>
	<span>{text}</span>
</div>

<style>
	.feedback {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.45em 0.9em 0.45em 0.55em;
		border: 3px solid var(--ink);
		border-radius: 999px;
		background: var(--card);
		color: var(--ink);
		font-weight: 700;
		font-size: 0.95rem;
		line-height: 1.2;
		box-shadow: 0 3px 0 var(--ink);
		max-width: 100%;
	}
	.disc {
		fill: var(--ink);
	}
	.good .disc {
		fill: var(--basil);
	}
	.oops .disc {
		fill: var(--tomato);
	}
	.info .disc {
		fill: var(--sky);
	}
	.mark {
		fill: none;
		stroke: #fff;
		stroke-width: 2.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
