<script lang="ts">
	import LevelPlayer from '#lib/pizzeria/LevelPlayer.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Monde {data.level.world}, niveau {data.level.index} · La Pizzeria</title>
</svelte:head>

{#key data.level.id}
	<LevelPlayer level={data.level} />
{/key}
