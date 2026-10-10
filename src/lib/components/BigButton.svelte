<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost';
		href?: string;
		wide?: boolean;
		children: Snippet;
	}

	let { variant = 'primary', href, wide = false, children, ...rest }: Props = $props();
</script>

{#if href}
	<a class="btn {variant}" class:wide {href}>{@render children()}</a>
{:else}
	<button class="btn {variant}" class:wide type="button" {...rest}>{@render children()}</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
		min-height: var(--touch, 48px);
		min-width: var(--touch, 48px);
		padding: 0 1.2em;
		border: 3px solid var(--ink);
		border-radius: 999px;
		font: inherit;
		font-weight: 800;
		font-size: 1.05rem;
		text-decoration: none;
		cursor: pointer;
		box-shadow: 0 4px 0 var(--ink);
		transition:
			transform 80ms ease-out,
			box-shadow 80ms ease-out;
		-webkit-tap-highlight-color: transparent;
	}
	.btn:active {
		transform: translateY(3px);
		box-shadow: 0 1px 0 var(--ink);
	}
	.btn:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 3px;
	}
	.btn:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.primary {
		background: var(--tomato);
		color: #fff;
	}
	.secondary {
		background: var(--cheese);
		color: var(--ink);
	}
	.ghost {
		background: var(--card);
		color: var(--ink);
	}
	.wide {
		width: 100%;
	}
</style>
