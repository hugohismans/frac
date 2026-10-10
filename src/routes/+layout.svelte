<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '#lib/assets/favicon.svg';
	import { install } from '#lib/install.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => install.start());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Fractio</title>
</svelte:head>

{@render children()}
