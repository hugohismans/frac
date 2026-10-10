<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import BigButton from '#lib/components/BigButton.svelte';
	import Feedback from '#lib/components/Feedback.svelte';
	import FractionLabel from '#lib/components/FractionLabel.svelte';
	import Pizza from '#lib/components/Pizza.svelte';
	import Board from '#lib/game2048/Board.svelte';
	import DivisorPicker from '#lib/game2048/DivisorPicker.svelte';
	import { Game2048 } from '#lib/game2048/game.svelte.js';
	import { findVariant, type Direction } from '#lib/game2048/engine.js';
	import NewGameSheet from '#lib/game2048/NewGameSheet.svelte';
	import { prefs, savePrefs } from '#lib/prefs.svelte.js';

	const game = new Game2048();
	onDestroy(() => game.destroy());

	let optionsOpen = $state(false);
	let setupOpen = $state(false);

	const KEYS: Record<string, Direction> = {
		ArrowUp: 'up',
		ArrowDown: 'down',
		ArrowLeft: 'left',
		ArrowRight: 'right',
		w: 'up',
		s: 'down',
		a: 'left',
		d: 'right'
	};

	function onkeydown(e: KeyboardEvent) {
		if (optionsOpen || setupOpen || e.altKey || e.ctrlKey || e.metaKey) return;
		const dir = KEYS[e.key];
		if (dir) {
			e.preventDefault();
			game.move(dir);
			return;
		}
		if (e.key === 'Escape') {
			game.deselect();
			return;
		}
		const k = Number(e.key);
		if (game.selected && Number.isInteger(k) && game.choices.includes(k)) {
			game.pick(k);
		}
	}

	function startGame(variantId: string, size: number) {
		setupOpen = false;
		game.newGame(variantId, size);
	}

	const variant = $derived(findVariant(game.rules.variantId));
	const usesTriples = $derived(game.rules.ladder.some((k) => k > 2));

	function toggle(key: 'haptics' | 'helpLongPress' | 'helpColorByValue') {
		prefs[key] = !prefs[key];
		savePrefs();
	}
</script>

<svelte:head>
	<title>Fraction 2048 · Fractio</title>
</svelte:head>

<svelte:window {onkeydown} />

<main>
	<header>
		<a class="round" href={resolve('/')} aria-label="Retour à l'accueil">
			<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"
				><path d="M15 5l-7 7 7 7" /></svg
			>
		</a>
		<div class="title">
			<h1>Fraction 2048</h1>
			<span class="mode">{variant.name} · {game.rules.size} × {game.rules.size}</span>
		</div>
		<button
			class="round"
			type="button"
			aria-label="Nouvelle partie"
			aria-haspopup="dialog"
			onclick={() => (setupOpen = true)}
		>
			<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
				<path d="M19 12a7 7 0 1 1-2.1-5M19 4.5v4h-4" />
			</svg>
		</button>
		<button
			class="round"
			type="button"
			aria-label="Options d'aide"
			aria-expanded={optionsOpen}
			onclick={() => (optionsOpen = !optionsOpen)}
		>
			<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
				<circle cx="12" cy="12" r="9" />
				<path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 16.8v.2" />
			</svg>
		</button>
	</header>

	<section class="scores" aria-label="Score">
		<div class="score">
			<span class="label">Score</span>
			<span class="value">{game.score}</span>
			{#if game.gain}
				{#key game.gain.id}
					<span class="gain" aria-hidden="true">+{game.gain.points}</span>
				{/key}
			{/if}
		</div>
		<div class="score">
			<span class="label">Record</span>
			<span class="value">{game.best}</span>
		</div>
		<div class="score combo" class:active={game.combo > 1}>
			<span class="label">Combo</span>
			<span class="value">x{Math.max(1, game.combo)}</span>
		</div>
	</section>

	<div class="toast-slot" aria-live="polite">
		{#if game.toast}
			{#key game.toast.id}
				<div class="toast"><Feedback tone={game.toast.tone} text={game.toast.text} /></div>
			{/key}
		{/if}
	</div>

	<div class="board-wrap">
		<Board {game} />
	</div>

	<div class="panel">
		{#if game.selected}
			<DivisorPicker
				value={game.selected.value}
				choices={game.choices}
				rejected={game.rejected}
				onpick={(k) => game.pick(k)}
				onclose={() => game.deselect()}
			/>
		{:else}
			<p class="hint">
				Glisse pour faire bouger les tuiles. Les fractions <strong>égales</strong>
				fusionnent{usesTriples ? ' (●●● : il en faut trois alignées)' : ''}. Touche une tuile pour
				la simplifier{prefs.helpLongPress ? ', garde le doigt dessus pour voir sa pizza' : ''}.
			</p>
		{/if}
	</div>

	<p class="visually-hidden" aria-live="polite">{game.announce}</p>

	{#if optionsOpen}
		<div class="sheet-backdrop" role="presentation" onclick={() => (optionsOpen = false)}></div>
		<div class="sheet" role="dialog" aria-label="Options d'aide">
			<h2>Aides</h2>
			<label class="option">
				<input
					type="checkbox"
					checked={prefs.helpLongPress}
					onchange={() => toggle('helpLongPress')}
				/>
				<span>Appui long sur une tuile : voir sa pizza</span>
			</label>
			<label class="option">
				<input
					type="checkbox"
					checked={prefs.helpColorByValue}
					onchange={() => toggle('helpColorByValue')}
				/>
				<span>Même couleur pour les fractions égales</span>
			</label>
			<label class="option">
				<input type="checkbox" checked={prefs.haptics} onchange={() => toggle('haptics')} />
				<span>Vibrations</span>
			</label>
			<BigButton variant="primary" wide onclick={() => (optionsOpen = false)}>Fermer</BigButton>
		</div>
	{/if}

	{#if setupOpen}
		<NewGameSheet
			variantId={game.rules.variantId}
			size={game.rules.size}
			inProgress={game.phase !== 'over' && game.score > 0}
			onstart={startGame}
			onclose={() => (setupOpen = false)}
		/>
	{:else if game.phase === 'won'}
		<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="won-title">
			<div class="dialog">
				<div class="celebrate" aria-hidden="true"><Pizza parts={8} size={120} /></div>
				<h2 id="won-title">Une pizza entière !</h2>
				<p>
					Tu as rassemblé assez de parts pour faire <FractionLabel
						value={{ n: 1, d: 1 }}
						size={20}
					/>.
				</p>
				<p>
					Tu peux continuer pour en faire {game.rules.afterOne}, puis {game.rules.afterOne *
						game.rules.afterOne}...
				</p>
				<BigButton variant="primary" wide onclick={() => game.continueAfterWin()}
					>Continuer</BigButton
				>
				<BigButton variant="ghost" wide onclick={() => game.newGame()}>Nouvelle partie</BigButton>
			</div>
		</div>
	{:else if game.phase === 'over'}
		<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="over-title">
			<div class="dialog">
				<h2 id="over-title">Plus aucun mouvement</h2>
				<p>Aucune tuile ne peut bouger ni fusionner.</p>
				<p class="final">Score : <strong>{game.score}</strong></p>
				{#if game.score >= game.best && game.score > 0}
					<p class="record">Nouveau record !</p>
				{/if}
				<BigButton variant="primary" wide onclick={() => game.newGame()}>Rejouer</BigButton>
				<BigButton variant="ghost" wide onclick={() => (setupOpen = true)}
					>Changer de brique ou de grille</BigButton
				>
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		position: relative;
		max-width: 480px;
		min-height: 100dvh;
		margin: 0 auto;
		padding: max(8px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.board-wrap {
		width: min(100%, calc(100dvh - 300px));
		min-width: 260px;
		align-self: center;
	}
	header {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.title {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
	}
	h1 {
		font-size: 1.25rem;
		font-weight: 900;
		white-space: nowrap;
	}
	.mode {
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--ink-soft);
	}
	.round {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border: 3px solid var(--ink);
		border-radius: 50%;
		background: var(--card);
		color: var(--ink);
		box-shadow: 0 3px 0 var(--ink);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
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
	.scores {
		display: grid;
		grid-template-columns: 1fr 1fr auto;
		gap: 8px;
	}
	.score {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2px 10px 4px;
		border: 3px solid var(--ink);
		border-radius: 16px;
		background: var(--card);
	}
	.label {
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ink-soft);
	}
	.value {
		font-size: 1.35rem;
		font-weight: 900;
		font-variant-numeric: tabular-nums;
	}
	.combo.active {
		background: var(--cheese);
	}
	.gain {
		position: absolute;
		right: 6px;
		top: -4px;
		font-weight: 900;
		color: var(--basil);
		animation: rise 700ms ease-out forwards;
		pointer-events: none;
	}
	.toast-slot {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 40px;
	}
	.toast {
		animation: drop 180ms ease-out;
	}
	.panel {
		min-height: 112px;
		display: flex;
		align-items: center;
	}
	.hint {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.35;
		color: var(--ink-soft);
		font-weight: 600;
		text-align: center;
	}
	.sheet-backdrop,
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 20;
		background: rgba(43, 33, 24, 0.45);
	}
	.sheet {
		position: fixed;
		left: 50%;
		bottom: 0;
		z-index: 21;
		width: min(480px, 100%);
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 20px 16px max(20px, env(safe-area-inset-bottom));
		border: 3px solid var(--ink);
		border-bottom: none;
		border-radius: 24px 24px 0 0;
		background: var(--bg);
	}
	.option {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 48px;
		font-weight: 700;
	}
	.option input {
		width: 28px;
		height: 28px;
		accent-color: var(--basil);
		flex: none;
	}
	.overlay {
		user-select: none;
		-webkit-user-select: none;
		display: grid;
		place-items: center;
		padding: 16px;
	}
	.dialog {
		width: min(360px, 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 24px 20px;
		border: 3px solid var(--ink);
		border-radius: 26px;
		background: var(--bg);
		box-shadow: 0 8px 0 var(--ink);
		text-align: center;
		animation: drop 220ms ease-out;
	}
	.dialog p {
		margin: 0;
		font-weight: 600;
	}
	.final {
		font-size: 1.3rem;
	}
	.record {
		color: var(--basil);
		font-weight: 900 !important;
	}
	.celebrate {
		animation: spin 1.2s ease-out;
	}
	@keyframes rise {
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 0;
			transform: translateY(-22px);
		}
	}
	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-8px) scale(0.96);
		}
	}
	@keyframes spin {
		from {
			transform: rotate(-200deg) scale(0.4);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.gain,
		.toast,
		.dialog,
		.celebrate {
			animation: none;
		}
		.gain {
			display: none;
		}
	}
	@media (max-height: 640px) {
		.hint {
			font-size: 0.85rem;
		}
		h1 {
			font-size: 1.1rem;
		}
	}
</style>
