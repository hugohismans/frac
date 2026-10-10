<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import BigButton from '../components/BigButton.svelte';
	import Feedback from '../components/Feedback.svelte';
	import FractionLabel from '../components/FractionLabel.svelte';
	import Pizza from '../components/Pizza.svelte';
	import Stars from '../components/Stars.svelte';
	import { isSameForm } from '../fraction';
	import { fractionWords } from '../fractionWords';
	import { motion } from '../motion.svelte';
	import { PIZZERIA } from '../settings';
	import CompareView from './CompareView.svelte';
	import Customer, { type Mood } from './Customer.svelte';
	import CutPicker from './CutPicker.svelte';
	import { isLevelUnlocked, nextLevel } from './engine';
	import { LevelGame } from './level.svelte';
	import { WORLDS, findWorld } from './levels';
	import PizzaBoard from './PizzaBoard.svelte';
	import { progress } from './progress.svelte';
	import { prefs } from '../prefs.svelte';
	import type { Level } from './types';

	interface Props {
		level: Level;
	}

	let { level }: Props = $props();

	// svelte-ignore state_referenced_locally
	let game = $state(new LevelGame(level, !level.tip && level.index !== 1));
	onDestroy(() => game.destroy());

	const world = $derived(findWorld(level.world)!);
	const next = $derived(nextLevel(level, WORLDS));
	const nextOpen = $derived(
		!!next && isLevelUnlocked(next, WORLDS, progress.stars, prefs.teacherMode)
	);

	let width = $state(360);
	let viewportHeight = $state(700);
	const pizzaSize = $derived(
		Math.round(
			Math.max(
				170,
				Math.min(
					PIZZERIA.PIZZA_MAX_PX,
					width - 48,
					// Le monde 3 a une rangée de boutons « Regrouper » en plus.
					viewportHeight - (game.order.kind === 'simplify' ? 470 : 400)
				)
			)
		)
	);

	const mood: Mood = $derived.by(() => {
		if (game.phase === 'leaving') return 'happy';
		if (game.phase !== 'feedback' || !game.result) return 'waiting';
		switch (game.result.verdict) {
			case 'exact':
				return 'happy';
			case 'tooLittle':
				return 'hungry';
			case 'tooMuch':
				return 'surprised';
			default:
				return 'thinking';
		}
	});

	const served = $derived(game.cut ? { n: game.selectedCount, d: game.cut } : { n: 0, d: 1 });

	function replay() {
		game.destroy();
		game = new LevelGame(level, true);
	}

	const starsMessage = $derived(
		game.stars === 3
			? 'Parfait, aucune erreur !'
			: game.stars === 2
				? 'Très bien, presque parfait !'
				: 'Niveau réussi ! Rejoue pour gagner plus d’étoiles.'
	);
</script>

<svelte:window bind:innerHeight={viewportHeight} />

<main bind:clientWidth={width} style:--regroup-ms="{motion.ms(PIZZERIA.REGROUP_MS)}ms">
	<header>
		<a class="round" href={resolve('/pizzeria')} aria-label="Retour à la carte">
			<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"
				><path d="M15 5l-7 7 7 7" /></svg
			>
		</a>
		<div class="title">
			<h1>Monde {level.world} · Niveau {level.index}</h1>
			<span class="sub">{world.name}</span>
		</div>
		<ol class="queue" aria-label="Clients : {game.index + 1} sur {level.customers.length}">
			{#each level.customers as _, i (i)}
				<li
					class:done={i < game.index || game.phase === 'complete'}
					class:current={i === game.index && game.phase !== 'complete'}
				></li>
			{/each}
		</ol>
	</header>

	<!-- Le client et sa bulle -->
	<section class="counter" aria-live="polite">
		{#if game.phase !== 'intro' && game.phase !== 'complete'}
			{#key game.index}
				<div class="customer" class:leaving={game.phase === 'leaving'}>
					<Customer look={game.customer.look} {mood} size={92} />
					<span class="name">{game.customer.name}</span>
				</div>
			{/key}
			<div class="bubble" class:hidden={game.phase === 'arriving' || game.phase === 'leaving'}>
				{#if game.phase === 'feedback' && game.result}
					{#if game.result.verdict === 'exact'}
						<p class="say">Miam, merci !</p>
						{#if !isSameForm(game.result.served, game.result.order) && game.order.kind !== 'simplify'}
							<p class="equation">
								<FractionLabel value={game.result.served} size={22} />
								<span>=</span>
								<FractionLabel value={game.result.order} size={22} />
							</p>
						{/if}
					{:else if game.result.verdict === 'tooLittle'}
						<p class="say">J'ai encore faim !</p>
					{:else if game.result.verdict === 'tooMuch'}
						<p class="say">Oh là, c'est trop pour moi !</p>
					{:else}
						<p class="say">
							C'est la bonne quantité, mais je voudrais moins de parts, plus grosses !
						</p>
					{/if}
				{:else if game.order.kind === 'simplify' && game.order.ask === 'fewestParts'}
					<p class="say">Le moins de parts possible, s'il te plaît !</p>
				{:else}
					<p class="say">Je voudrais</p>
					<p class="order">
						<FractionLabel value={game.wanted} size={30} />
						<span>de pizza{game.order.kind === 'simplify' ? ', en grosses parts' : ''}</span>
					</p>
					<p class="words">({fractionWords(game.wanted)})</p>
				{/if}
			</div>
		{/if}
	</section>

	<!-- Plan de travail -->
	<section class="work">
		{#if game.phase === 'cutting'}
			<Pizza
				parts={1}
				size={Math.round(pizzaSize * 0.7)}
				label="Pizza entière, pas encore coupée"
			/>
			<p class="prompt">En combien de parts couper la pizza ?</p>
			{#if game.order.kind === 'parts'}
				<CutPicker choices={game.order.cutChoices} onpick={(k) => game.chooseCut(k)} />
			{/if}
		{:else if game.phase === 'selecting' || game.phase === 'serving' || game.phase === 'arriving'}
			<div
				class="pizza-slot"
				class:serving={game.phase === 'serving'}
				class:arriving={game.phase === 'arriving'}
			>
				{#if game.order.kind === 'simplify' && game.tray}
					<PizzaBoard
						parts={game.tray.d}
						filled={game.tray.n}
						size={pizzaSize}
						fadingCuts={game.merging}
						groups={game.regroupFail
							? {
									k: game.regroupFail.k,
									count: game.regroupFail.reason === 'pizza' ? game.tray.d : game.tray.n
								}
							: null}
						label="Plateau : {fractionWords(game.tray)} de pizza"
					/>
				{:else if game.cut}
					<PizzaBoard
						parts={game.cut}
						size={pizzaSize}
						selected={game.selected}
						onslice={(i) => game.toggle(i)}
						label="Pizza coupée en {game.cut} parts, {game.selectedCount} choisie{game.selectedCount >
						1
							? 's'
							: ''}"
					/>
				{/if}
			</div>

			<div class="status">
				{#if game.order.kind === 'simplify' && game.tray}
					{#if game.regroupFail}
						<Feedback
							tone="oops"
							text={game.regroupFail.reason === 'pizza'
								? `${game.tray.d} parts en paquets de ${game.regroupFail.k} : il en reste ${game.regroupFail.leftover}.`
								: `${game.tray.n} parts sur le plateau en paquets de ${game.regroupFail.k} : il en reste ${game.regroupFail.leftover}.`}
						/>
					{:else}
						<span>Sur le plateau :</span>
						<FractionLabel value={game.tray} size={22} />
					{/if}
				{:else if game.selectedCount === 0}
					<span>Touche les parts à servir.</span>
				{:else}
					<span>Tu sers :</span>
					<FractionLabel value={served} size={22} />
				{/if}
			</div>

			<div class="actions">
				{#if game.order.kind === 'simplify'}
					<div class="regroup" role="group" aria-label="Regrouper les parts">
						{#each PIZZERIA.REGROUP_CHOICES as k (k)}
							<button
								type="button"
								class="chip"
								disabled={game.phase !== 'selecting' || !!game.merging}
								onclick={() => game.regroup(k)}
							>
								<span class="small">Regrouper par</span>
								<strong>{k}</strong>
							</button>
						{/each}
					</div>
				{:else if game.order.kind === 'parts'}
					<BigButton
						variant="ghost"
						onclick={() => game.recut()}
						disabled={game.phase !== 'selecting'}>Recouper</BigButton
					>
				{/if}
				<BigButton variant="primary" onclick={() => game.serve()} disabled={!game.canServe}
					>Servir</BigButton
				>
			</div>
		{:else if game.phase === 'feedback' && game.result}
			{#if game.order.kind === 'simplify'}
				<Pizza
					parts={game.result.served.d}
					filled={game.result.served.n}
					size={Math.round(pizzaSize * 0.8)}
				/>
			{:else}
				<CompareView
					served={game.result.served}
					order={game.result.order}
					size={Math.round(pizzaSize * 0.8)}
				/>
			{/if}
			{#if game.result.verdict !== 'exact'}
				<div class="actions">
					<BigButton variant="secondary" onclick={() => game.retry()}>Réessayer</BigButton>
				</div>
			{/if}
		{/if}
	</section>

	<p class="visually-hidden" aria-live="polite">{game.announce}</p>

	{#if game.phase === 'intro'}
		<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="intro-title">
			<div class="dialog">
				<Pizza parts={4} filled={3} size={90} />
				{#if level.index === 1}
					<h2 id="intro-title">Monde {world.id} : {world.name}</h2>
					<p>{world.intro}</p>
				{:else}
					<h2 id="intro-title">Niveau {level.index}</h2>
				{/if}
				{#if level.tip}
					<p class="tip">{level.tip}</p>
				{/if}
				<BigButton variant="primary" wide onclick={() => game.start()}>C'est parti !</BigButton>
			</div>
		</div>
	{:else if game.phase === 'complete'}
		<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="done-title">
			<div class="dialog">
				<h2 id="done-title">Tous les clients sont servis !</h2>
				<Stars count={game.stars} size={44} />
				<p>{starsMessage}</p>
				{#if next && nextOpen}
					<BigButton
						variant="primary"
						wide
						href={resolve('/pizzeria/[world]/[level]', {
							world: String(next.world),
							level: String(next.index)
						})}>{next.world !== level.world ? `Monde ${next.world} !` : 'Niveau suivant'}</BigButton
					>
				{/if}
				<BigButton variant="secondary" wide onclick={replay}>Rejouer</BigButton>
				<BigButton variant="ghost" wide href={resolve('/pizzeria')}>Carte des mondes</BigButton>
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		max-width: 480px;
		min-height: 100dvh;
		margin: 0 auto;
		padding: max(8px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 8px;
		overflow-x: hidden;
	}
	header {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.title {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	h1 {
		font-size: 1.1rem;
		font-weight: 900;
		white-space: nowrap;
	}
	.sub {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
	}
	.round {
		flex: none;
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border: 3px solid var(--ink);
		border-radius: 50%;
		background: var(--card);
		box-shadow: 0 3px 0 var(--ink);
	}
	.round:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}
	.round svg {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.queue {
		display: flex;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.queue li {
		width: 14px;
		height: 14px;
		border: 2.5px solid var(--ink);
		border-radius: 50%;
		background: var(--card);
	}
	.queue li.done {
		background: var(--basil);
	}
	.queue li.current {
		background: var(--cheese);
		transform: scale(1.2);
	}
	.counter {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 130px;
		padding: 6px 10px;
		border: 3px solid var(--ink);
		border-radius: var(--radius);
		background: linear-gradient(#fde7c2, #f8d6a0);
	}
	.customer {
		flex: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: arrive var(--arrive-ms, 450ms) ease-out;
	}
	.customer.leaving {
		animation: leave 400ms ease-in forwards;
	}
	.name {
		font-size: 0.85rem;
		font-weight: 800;
	}
	.bubble {
		position: relative;
		flex: 1;
		min-width: 0;
		padding: 8px 12px;
		border: 3px solid var(--ink);
		border-radius: 18px;
		background: var(--card);
		transition: opacity 150ms ease-out;
	}
	.bubble::before {
		content: '';
		position: absolute;
		left: -12px;
		top: 50%;
		width: 16px;
		height: 16px;
		border-left: 3px solid var(--ink);
		border-bottom: 3px solid var(--ink);
		background: var(--card);
		transform: translateY(-50%) rotate(45deg);
	}
	.bubble.hidden {
		opacity: 0;
	}
	.bubble p {
		margin: 0;
	}
	.say {
		font-weight: 800;
		line-height: 1.25;
	}
	.order,
	.equation {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 800;
	}
	.equation span {
		font-size: 1.4rem;
	}
	.words {
		font-size: 0.85rem;
		color: var(--ink-soft);
		font-weight: 700;
	}
	.work {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		touch-action: none;
	}
	.pizza-slot {
		transition:
			transform var(--serve-ms, 450ms) ease-in,
			opacity var(--serve-ms, 450ms) ease-in;
	}
	.pizza-slot.serving {
		transform: translateY(-140px) scale(0.35);
		opacity: 0;
	}
	.pizza-slot.arriving {
		opacity: 0.4;
	}
	.prompt {
		margin: 0;
		font-weight: 800;
		font-size: 1.05rem;
	}
	.status {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 52px;
		font-weight: 800;
		text-align: center;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
	}
	.regroup {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
		width: 100%;
	}
	.chip {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 56px;
		padding: 4px;
		border: 3px solid var(--ink);
		border-radius: 14px;
		background: var(--cheese);
		color: var(--ink);
		font: inherit;
		box-shadow: 0 3px 0 var(--ink);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	.chip:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 var(--ink);
	}
	.chip:disabled {
		opacity: 0.5;
	}
	.chip:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}
	.chip .small {
		font-size: 0.7rem;
		font-weight: 700;
	}
	.chip strong {
		font-size: 1.3rem;
		line-height: 1;
	}
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 20;
		display: grid;
		place-items: center;
		padding: 16px;
		background: rgba(43, 33, 24, 0.45);
	}
	.dialog {
		width: min(360px, 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 22px 20px;
		border: 3px solid var(--ink);
		border-radius: 26px;
		background: var(--bg);
		box-shadow: 0 8px 0 var(--ink);
		text-align: center;
	}
	.dialog p {
		margin: 0;
		font-weight: 600;
		line-height: 1.35;
	}
	.dialog .tip {
		padding: 8px 12px;
		border: 2px dashed var(--crust);
		border-radius: 14px;
		font-weight: 700;
	}
	@keyframes arrive {
		from {
			transform: translateX(120px);
			opacity: 0;
		}
	}
	@keyframes leave {
		to {
			transform: translateX(-140px);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.customer,
		.customer.leaving {
			animation: none;
		}
		.pizza-slot {
			transition: opacity 150ms;
		}
		.pizza-slot.serving {
			transform: none;
		}
	}
	@media (max-height: 660px) {
		.counter {
			min-height: 112px;
		}
	}
</style>
