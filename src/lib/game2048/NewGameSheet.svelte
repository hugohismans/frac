<script lang="ts">
	import BigButton from '../components/BigButton.svelte';
	import FractionLabel from '../components/FractionLabel.svelte';
	import { G2048 } from '../settings';
	import { findVariant, makeRules } from './engine';

	interface Props {
		variantId: string;
		size: number;
		/** Une partie est en cours : prévenir qu'elle sera perdue. */
		inProgress: boolean;
		onstart: (variantId: string, size: number) => void;
		onclose: () => void;
	}

	let { variantId, size, inProgress, onstart, onclose }: Props = $props();

	// Choix en cours dans la feuille, initialisés avec la partie actuelle.
	// svelte-ignore state_referenced_locally
	let chosenVariant = $state(variantId);
	// svelte-ignore state_referenced_locally
	let chosenSize = $state(size);

	const ladder = $derived(makeRules(findVariant(chosenVariant)).levels);

	function pickVariant(id: string) {
		chosenVariant = id;
		chosenSize = findVariant(id).defaultSize;
	}
</script>

<div class="backdrop" role="presentation" onclick={onclose}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="new-game-title">
	<h2 id="new-game-title">Nouvelle partie</h2>

	<fieldset>
		<legend>Brique de base</legend>
		<div class="variants">
			{#each G2048.VARIANTS as v (v.id)}
				<label class="variant" class:on={chosenVariant === v.id}>
					<input
						type="radio"
						name="variant"
						value={v.id}
						checked={chosenVariant === v.id}
						onchange={() => pickVariant(v.id)}
					/>
					<span class="brick" aria-hidden="true">
						<FractionLabel value={{ n: 1, d: v.brick }} size={16} decorative />
					</span>
					<span class="text">
						<strong>{v.name}</strong>
						<span>{v.description}</span>
					</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<p class="ladder" aria-label="Chemin jusqu'à une pizza entière">
		{#each ladder as level, i (i)}
			{#if i > 0}<span class="step" aria-hidden="true">→</span>{/if}
			<FractionLabel value={level} size={15} />
		{/each}
	</p>

	<fieldset>
		<legend>Taille de la grille</legend>
		<div class="sizes">
			{#each G2048.SIZES as s (s)}
				<label class="size" class:on={chosenSize === s}>
					<input
						type="radio"
						name="size"
						value={s}
						checked={chosenSize === s}
						onchange={() => (chosenSize = s)}
					/>
					<span>{s} × {s}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	{#if inProgress}
		<p class="warning">La partie en cours sera perdue.</p>
	{/if}
	<div class="actions">
		<BigButton variant="ghost" onclick={onclose}>Annuler</BigButton>
		<BigButton variant="primary" onclick={() => onstart(chosenVariant, chosenSize)}>Jouer</BigButton
		>
	</div>
</div>

<style>
	.backdrop {
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
		max-height: 92dvh;
		overflow-y: auto;
		overscroll-behavior: contain;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 18px 16px max(18px, env(safe-area-inset-bottom));
		border: 3px solid var(--ink);
		border-bottom: none;
		border-radius: 24px 24px 0 0;
		background: var(--bg);
	}
	h2 {
		font-size: 1.3rem;
		font-weight: 900;
	}
	fieldset {
		margin: 0;
		padding: 0;
		border: none;
	}
	legend {
		margin-bottom: 6px;
		font-weight: 800;
		color: var(--ink-soft);
	}
	input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.variants {
		display: grid;
		gap: 8px;
	}
	.variant {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 56px;
		padding: 6px 12px;
		border: 3px solid var(--ink);
		border-radius: 16px;
		background: var(--card);
		cursor: pointer;
	}
	.variant.on,
	.size.on {
		background: var(--cheese);
		box-shadow: 0 3px 0 var(--ink);
	}
	.variant.on::after {
		content: '✓';
		position: absolute;
		right: 12px;
		font-weight: 900;
		font-size: 1.2rem;
	}
	.variant:has(input:focus-visible),
	.size:has(input:focus-visible) {
		outline: 4px solid var(--focus);
		outline-offset: 2px;
	}
	.brick {
		display: grid;
		place-items: center;
		flex: none;
		width: 44px;
		height: 44px;
		border: 2px solid var(--ink);
		border-radius: 10px;
		background: var(--plate);
	}
	.text {
		display: flex;
		flex-direction: column;
		padding-right: 20px;
		font-size: 0.88rem;
		font-weight: 600;
		line-height: 1.25;
	}
	.text strong {
		font-size: 1.05rem;
		font-weight: 900;
	}
	.ladder {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 6px;
		margin: 0;
		padding: 6px;
		border: 2px dashed var(--crust);
		border-radius: 14px;
	}
	.step {
		font-weight: 900;
		color: var(--ink-soft);
	}
	.sizes {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}
	.size {
		position: relative;
		display: grid;
		place-items: center;
		min-height: 48px;
		border: 3px solid var(--ink);
		border-radius: 14px;
		background: var(--card);
		font-weight: 900;
		cursor: pointer;
	}
	.warning {
		margin: 0;
		font-weight: 700;
		text-align: center;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}
</style>
