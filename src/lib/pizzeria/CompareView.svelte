<script lang="ts">
	/**
	 * Superpose la commande (contour en pointillés) et ce qui a été servi (parts garnies),
	 * avec la différence hachurée (il manque) ou barrée (en trop).
	 */
	import Pizza, { sector } from '../components/Pizza.svelte';
	import FractionLabel from '../components/FractionLabel.svelte';
	import { compare, type Fraction } from '../fraction';
	import { difference } from './engine';

	interface Props {
		served: Fraction;
		order: Fraction;
		size: number;
	}

	let { served, order, size }: Props = $props();

	const uid = $props.id();
	const start = -Math.PI / 2;
	const full = Math.PI * 2;
	const angleOf = (f: Fraction) => (full * f.n) / f.d;
	const verdict = $derived(compare(served, order));
	const orderPath = $derived(sector(47, start, start + Math.min(full, angleOf(order))));
	const diffPath = $derived.by(() => {
		if (verdict === 0) return null;
		const a = angleOf(served);
		const b = angleOf(order);
		return sector(46, start + Math.min(a, b), start + Math.max(a, b));
	});
	const diff = $derived(difference(served, order));
</script>

<div class="compare">
	<div class="pizza" style:width="{size}px" style:height="{size}px">
		<Pizza parts={served.d} filled={served.n} {size} />
		<svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
			<defs>
				<pattern
					id="miss-{uid}"
					width="5"
					height="5"
					patternUnits="userSpaceOnUse"
					patternTransform="rotate(45)"
				>
					<rect width="5" height="5" fill="rgba(255,255,255,0.65)" />
					<line x1="0" y1="0" x2="0" y2="5" stroke="#2b2118" stroke-width="1.6" />
				</pattern>
				<pattern id="extra-{uid}" width="6" height="6" patternUnits="userSpaceOnUse">
					<rect width="6" height="6" fill="rgba(255,255,255,0.55)" />
					<path d="M0 0 L6 6 M6 0 L0 6" stroke="#c7372a" stroke-width="1.4" />
				</pattern>
			</defs>
			{#if diffPath}
				<path d={diffPath} fill="url(#{verdict < 0 ? 'miss' : 'extra'}-{uid})" class="diff" />
			{/if}
			<path d={orderPath} class="order" />
		</svg>
	</div>
	<ul class="legend">
		<li>
			<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
				><rect x="3" y="3" width="18" height="18" rx="4" class="key-order" /></svg
			>
			Commande : <FractionLabel value={order} size={15} />
		</li>
		{#if verdict < 0}
			<li>
				<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
					><rect
						x="3"
						y="3"
						width="18"
						height="18"
						rx="4"
						fill="url(#miss-{uid})"
						class="key-diff"
					/></svg
				>
				Il manque <FractionLabel value={diff} size={15} />
			</li>
		{:else if verdict > 0}
			<li>
				<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
					><rect
						x="3"
						y="3"
						width="18"
						height="18"
						rx="4"
						fill="url(#extra-{uid})"
						class="key-diff"
					/></svg
				>
				En trop : <FractionLabel value={diff} size={15} />
			</li>
		{/if}
	</ul>
</div>

<style>
	.compare {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
	.pizza {
		position: relative;
	}
	.pizza svg {
		position: absolute;
		inset: 0;
		overflow: visible;
	}
	.order {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2.6;
		stroke-dasharray: 5 3;
		stroke-linejoin: round;
	}
	.diff {
		stroke: var(--ink);
		stroke-width: 1;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 4px 16px;
		margin: 0;
		padding: 0;
		list-style: none;
		font-weight: 700;
		font-size: 0.95rem;
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.key-order {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2.4;
		stroke-dasharray: 4 2.5;
	}
	.key-diff {
		stroke: var(--ink);
		stroke-width: 1.2;
	}
</style>
