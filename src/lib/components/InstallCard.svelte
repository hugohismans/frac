<script lang="ts">
	import { install } from '../install.svelte';
	import BigButton from './BigButton.svelte';
</script>

{#if install.canPrompt}
	<div class="card">
		<p><strong>Installe Fractio</strong> sur ton écran d'accueil pour jouer même sans internet.</p>
		<BigButton variant="secondary" onclick={() => install.prompt()}>Installer</BigButton>
	</div>
{:else if install.iosHint}
	<div class="card">
		<p>
			<strong>Pour jouer sans internet :</strong> touche
			<svg viewBox="0 0 24 24" width="20" height="20" aria-label="Partager" role="img"
				><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7" /></svg
			>
			puis « Sur l'écran d'accueil ».
		</p>
	</div>
{/if}
{#if install.offlineReady}
	<p class="ready">
		<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"
			><path d="M5 12.5l4.5 4.5L19 7.5" /></svg
		>
		Prêt à jouer hors ligne
	</p>
{/if}

<style>
	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 14px;
		border: 3px dashed var(--ink);
		border-radius: var(--radius);
		background: var(--card);
		text-align: center;
	}
	p {
		margin: 0;
		font-weight: 600;
		line-height: 1.35;
	}
	svg {
		vertical-align: -4px;
		fill: none;
		stroke: var(--ink);
		stroke-width: 2.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.ready {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.ready svg {
		stroke: var(--basil);
		stroke-width: 3;
	}
</style>
