<script lang="ts">
	import { resolve } from '$app/paths';
	import BigButton from '#lib/components/BigButton.svelte';
	import Pizza from '#lib/components/Pizza.svelte';
</script>

<svelte:head>
	<title>La Pizzeria · Fractio</title>
</svelte:head>

<main>
	<Pizza parts={6} filled={4} size={120} />
	<h1>La Pizzeria</h1>
	<p>Le four chauffe ! La Pizzeria ouvre bientôt.</p>
	<BigButton href={resolve('/')} variant="ghost">Retour à l'accueil</BigButton>
</main>

<style>
	main {
		max-width: 520px;
		margin: 0 auto;
		padding: 48px 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		text-align: center;
	}
	p {
		margin: 0;
		font-weight: 600;
		color: var(--ink-soft);
	}
</style>
