<script lang="ts">
	import { resolve } from '$app/paths';
	import Pizza from '#lib/components/Pizza.svelte';
	import FractionLabel from '#lib/components/FractionLabel.svelte';
	import InstallCard from '#lib/components/InstallCard.svelte';
</script>

<svelte:head>
	<title>Fractio, les fractions en jouant</title>
</svelte:head>

<main>
	<header>
		<div class="logo" aria-hidden="true"><Pizza parts={4} filled={3} size={72} /></div>
		<h1>Fractio</h1>
		<p>Les fractions, ça se coupe, ça se partage et ça se mange !</p>
	</header>

	<nav aria-label="Choisir un jeu">
		<a class="card pizzeria" href={resolve('/pizzeria')}>
			<span class="icon" aria-hidden="true"><Pizza parts={8} filled={5} size={84} /></span>
			<span class="text">
				<strong>La Pizzeria</strong>
				<span>Coupe les pizzas et sers les bonnes parts aux clients.</span>
			</span>
		</a>
		<a class="card g2048" href={resolve('/2048')}>
			<span class="icon mini-grid" aria-hidden="true">
				<span><FractionLabel value={{ n: 1, d: 4 }} size={15} decorative /></span>
				<span><FractionLabel value={{ n: 2, d: 8 }} size={15} decorative /></span>
				<span><FractionLabel value={{ n: 3, d: 12 }} size={15} decorative /></span>
				<span class="one">1</span>
			</span>
			<span class="text">
				<strong>Fraction 2048</strong>
				<span>Fusionne les fractions égales jusqu'à une pizza entière.</span>
			</span>
		</a>
	</nav>

	<InstallCard />
</main>

<style>
	main {
		max-width: 520px;
		margin: 0 auto;
		padding: max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 28px;
	}
	header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
	.logo {
		animation: wobble 3s ease-in-out infinite;
	}
	h1 {
		font-size: 2.6rem;
		font-weight: 900;
		letter-spacing: 0.01em;
	}
	header p {
		margin: 0;
		font-size: 1.05rem;
		color: var(--ink-soft);
		font-weight: 600;
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.card {
		display: flex;
		align-items: center;
		gap: 16px;
		min-height: 120px;
		padding: 16px;
		border: 3px solid var(--ink);
		border-radius: var(--radius);
		color: var(--ink);
		text-decoration: none;
		box-shadow: 0 6px 0 var(--ink);
		transition:
			transform 90ms ease-out,
			box-shadow 90ms ease-out;
		-webkit-tap-highlight-color: transparent;
	}
	.card:active {
		transform: translateY(4px);
		box-shadow: 0 2px 0 var(--ink);
	}
	.card:focus-visible {
		outline: 4px solid var(--focus);
		outline-offset: 4px;
	}
	.pizzeria {
		background: #ffe3a3;
	}
	.g2048 {
		background: #d4f0c4;
	}
	.icon {
		flex: none;
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.98rem;
		font-weight: 600;
		line-height: 1.3;
	}
	.text strong {
		font-size: 1.35rem;
		font-weight: 900;
	}
	.mini-grid {
		display: grid;
		grid-template-columns: repeat(2, 40px);
		gap: 4px;
	}
	.mini-grid > span {
		display: grid;
		place-items: center;
		height: 40px;
		border: 2px solid var(--ink);
		border-radius: 10px;
		background: var(--card);
	}
	.mini-grid .one {
		background: var(--cheese);
		font-weight: 900;
		font-size: 1.3rem;
	}
	@keyframes wobble {
		0%,
		100% {
			transform: rotate(-6deg);
		}
		50% {
			transform: rotate(6deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.logo {
			animation: none;
		}
	}
</style>
