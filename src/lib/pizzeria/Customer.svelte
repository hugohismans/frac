<script lang="ts" module>
	export type Mood = 'waiting' | 'happy' | 'hungry' | 'surprised' | 'thinking';
</script>

<script lang="ts">
	import type { Look } from './customers';

	interface Props {
		look: Look;
		mood: Mood;
		size?: number;
	}

	let { look, mood, size = 96 }: Props = $props();
</script>

<svg class="customer {mood}" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
	<!-- buste -->
	<path d="M18 100 C18 78 32 70 50 70 C68 70 82 78 82 100 Z" fill={look.shirt} class="line" />
	<path d="M42 71 L50 80 L58 71" fill="none" class="line thin" />
	<!-- cheveux arrière -->
	{#if look.style === 'long'}
		<path d="M22 44 C20 70 28 74 34 74 L66 74 C72 74 80 70 78 44 Z" fill={look.hair} class="line" />
	{:else if look.style === 'bun'}
		<circle cx="50" cy="14" r="9" fill={look.hair} class="line" />
	{/if}
	<!-- tête -->
	<circle cx="50" cy="44" r="27" fill={look.skin} class="line" />
	<!-- cheveux avant -->
	{#if look.style === 'short' || look.style === 'long' || look.style === 'bun'}
		<path
			d="M23 42 C23 22 36 15 50 15 C64 15 77 22 77 42 C68 34 56 30 44 31 C36 32 28 36 23 42 Z"
			fill={look.hair}
			class="line"
		/>
	{:else if look.style === 'curly'}
		{#each [[30, 26], [40, 19], [52, 17], [63, 21], [72, 29], [25, 36], [76, 39]] as [x, y], i (i)}
			<circle cx={x} cy={y} r="8" fill={look.hair} class="line" />
		{/each}
	{:else if look.style === 'bald'}
		<path
			d="M24 46 C22 38 26 36 28 40 M76 46 C78 38 74 36 72 40"
			fill={look.hair}
			class="line thin"
		/>
		<path
			d="M38 60 C42 56 46 57 50 58 C54 57 58 56 62 60 C56 62 44 62 38 60 Z"
			fill={look.hair}
			class="line thin"
		/>
	{:else if look.style === 'cap'}
		<path d="M23 38 C23 20 36 14 50 14 C64 14 77 20 77 38 Z" fill={look.shirt} class="line" />
		<path d="M72 36 C82 36 90 38 92 41 L74 42 Z" fill={look.shirt} class="line" />
		<circle cx="50" cy="15" r="3" fill="#fff" class="line thin" />
	{/if}
	<!-- joues -->
	{#if mood === 'happy'}
		<circle cx="34" cy="53" r="4.5" fill="#ff9a8a" opacity="0.8" />
		<circle cx="66" cy="53" r="4.5" fill="#ff9a8a" opacity="0.8" />
	{/if}
	<!-- yeux -->
	{#if mood === 'happy'}
		<path d="M36 46 Q40 41 44 46 M56 46 Q60 41 64 46" fill="none" class="line eye" />
	{:else if mood === 'surprised'}
		<circle cx="40" cy="45" r="4" fill="#fff" class="line thin" />
		<circle cx="60" cy="45" r="4" fill="#fff" class="line thin" />
		<circle cx="40" cy="45" r="1.8" fill="#2b2118" />
		<circle cx="60" cy="45" r="1.8" fill="#2b2118" />
		<path d="M34 37 L44 35 M56 35 L66 37" fill="none" class="line thin" />
	{:else}
		<circle cx="40" cy="45" r="2.6" fill="#2b2118" />
		<circle cx="60" cy="45" r="2.6" fill="#2b2118" />
		{#if mood === 'hungry'}
			<path d="M34 40 L44 37 M56 37 L66 40" fill="none" class="line thin" />
		{:else if mood === 'thinking'}
			<path d="M35 39 L45 39 M55 37 L65 40" fill="none" class="line thin" />
		{/if}
	{/if}
	{#if look.glasses}
		<circle cx="40" cy="45" r="7" fill="none" class="line thin" />
		<circle cx="60" cy="45" r="7" fill="none" class="line thin" />
		<path d="M47 45 L53 45" class="line thin" />
	{/if}
	<!-- bouche -->
	{#if mood === 'happy'}
		<path d="M39 56 Q50 70 61 56 Z" fill="#8a2f22" class="line thin" />
	{:else if mood === 'hungry'}
		<path d="M41 61 Q50 54 59 61" fill="none" class="line" />
	{:else if mood === 'surprised'}
		<ellipse cx="50" cy="59" rx="4.5" ry="5.5" fill="#8a2f22" class="line thin" />
	{:else if mood === 'thinking'}
		<path d="M43 59 L57 58" fill="none" class="line" />
	{:else}
		<path d="M42 57 Q50 63 58 57" fill="none" class="line" />
	{/if}
</svg>

<style>
	.customer {
		display: block;
		overflow: visible;
	}
	.line {
		stroke: var(--ink, #2b2118);
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.thin {
		stroke-width: 1.8;
	}
	.eye {
		stroke-width: 3;
	}
	.happy {
		animation: bounce 600ms ease-out;
	}
	.hungry,
	.surprised {
		animation: wobble 500ms ease-in-out;
	}
	@keyframes bounce {
		30% {
			transform: translateY(-8px);
		}
		60% {
			transform: translateY(0);
		}
		80% {
			transform: translateY(-3px);
		}
	}
	@keyframes wobble {
		25% {
			transform: rotate(-5deg);
		}
		75% {
			transform: rotate(5deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.happy,
		.hungry,
		.surprised {
			animation: none;
		}
	}
</style>
