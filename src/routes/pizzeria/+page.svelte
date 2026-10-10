<script lang="ts">
	import { resolve } from '$app/paths';
	import Pizza from '#lib/components/Pizza.svelte';
	import Stars from '#lib/components/Stars.svelte';
	import { isLevelUnlocked, isWorldUnlocked } from '#lib/pizzeria/engine.js';
	import { WORLDS } from '#lib/pizzeria/levels.js';
	import { progress } from '#lib/pizzeria/progress.svelte.js';
	import { PIZZERIA } from '#lib/settings.js';

	const WORLD_COLORS = ['#ffe3a3', '#d4f0c4', '#d3e6ff', '#ffd6e8'];
	const WORLD_PIZZAS: [number, number][] = [
		[4, 3],
		[8, 4],
		[6, 4],
		[3, 2]
	];

	const totalStars = $derived(Object.values(progress.stars).reduce((a, b) => a + b, 0));
	const maxStars = WORLDS.reduce((sum, w) => sum + w.levels.length * 3, 0);
</script>

<svelte:head>
	<title>La Pizzeria · Fractio</title>
</svelte:head>

<main>
	<header>
		<a class="round" href={resolve('/')} aria-label="Retour à l'accueil">
			<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"
				><path d="M15 5l-7 7 7 7" /></svg
			>
		</a>
		<h1>La Pizzeria</h1>
		<span class="total" aria-label="{totalStars} étoiles sur {maxStars}">
			<Stars count={1} max={1} size={22} />
			{totalStars}
		</span>
	</header>

	{#each WORLDS as world, w (world.id)}
		{@const open = isWorldUnlocked(world, WORLDS, progress.stars)}
		<section class="world" class:locked={!open} style:--world={WORLD_COLORS[w]}>
			<div class="world-head">
				<Pizza parts={WORLD_PIZZAS[w][0]} filled={WORLD_PIZZAS[w][1]} size={56} />
				<div>
					<h2>Monde {world.id} : {world.name}</h2>
					<p>{world.concept}</p>
				</div>
			</div>
			{#if world.comingSoon}
				<p class="soon">Bientôt !</p>
			{:else if !open}
				<p class="soon">
					<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"
						><rect x="5" y="11" width="14" height="10" rx="2" /><path
							d="M8 11V8a4 4 0 0 1 8 0v3"
						/></svg
					>
					Réussis {PIZZERIA.WORLD_UNLOCK_COUNT} niveaux du monde {world.id - 1} pour l'ouvrir.
				</p>
			{:else}
				<ol class="levels">
					{#each world.levels as level (level.id)}
						{@const unlocked = isLevelUnlocked(level, WORLDS, progress.stars)}
						{@const stars = progress.stars[level.id] ?? 0}
						<li>
							{#if unlocked}
								<a
									class="level"
									class:done={stars > 0}
									href={resolve('/pizzeria/[world]/[level]', {
										world: String(level.world),
										level: String(level.index)
									})}
									aria-label="Niveau {level.index}, {stars} étoile{stars > 1 ? 's' : ''}"
								>
									<span class="num">{level.index}</span>
									<Stars count={stars} size={13} />
								</a>
							{:else}
								<span class="level closed" aria-label="Niveau {level.index}, fermé">
									<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"
										><rect x="5" y="11" width="14" height="10" rx="2" /><path
											d="M8 11V8a4 4 0 0 1 8 0v3"
										/></svg
									>
								</span>
							{/if}
						</li>
					{/each}
				</ol>
			{/if}
		</section>
	{/each}
</main>

<style>
	main {
		max-width: 520px;
		margin: 0 auto;
		padding: max(8px, env(safe-area-inset-top)) 12px max(24px, env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	header {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	h1 {
		flex: 1;
		font-size: 1.5rem;
		font-weight: 900;
		text-align: center;
	}
	.round {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border: 3px solid var(--ink);
		border-radius: 50%;
		background: var(--card);
		box-shadow: 0 3px 0 var(--ink);
	}
	.round svg {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.round:focus-visible,
	.level:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}
	.total {
		display: flex;
		align-items: center;
		gap: 4px;
		min-width: 48px;
		font-weight: 900;
		font-size: 1.1rem;
	}
	.world {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 12px;
		border: 3px solid var(--ink);
		border-radius: var(--radius);
		background: var(--world);
		box-shadow: 0 5px 0 var(--ink);
	}
	.world.locked {
		background: #efe6d8;
		box-shadow: none;
		border-style: dashed;
	}
	.world-head {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	h2 {
		font-size: 1.1rem;
		font-weight: 900;
	}
	.world-head p,
	.soon {
		margin: 0;
		font-weight: 600;
		font-size: 0.92rem;
	}
	.soon {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 800;
	}
	.soon svg,
	.closed svg {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2.2;
	}
	.levels {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.level {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: 64px;
		border: 3px solid var(--ink);
		border-radius: 16px;
		background: var(--card);
		color: var(--ink);
		text-decoration: none;
		box-shadow: 0 3px 0 var(--ink);
		-webkit-tap-highlight-color: transparent;
	}
	.level:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--ink);
	}
	.level.done {
		background: #fff8e1;
	}
	.num {
		font-size: 1.35rem;
		font-weight: 900;
		line-height: 1;
	}
	.closed {
		background: transparent;
		border-style: dashed;
		box-shadow: none;
		color: var(--ink-soft);
	}
</style>
