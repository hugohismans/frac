<script lang="ts">
	import type { Fraction } from '../fraction';

	interface Props {
		value: Fraction;
		width?: number;
		height?: number;
	}

	let { value, width = 220, height = 30 }: Props = $props();

	const wholeBars = $derived(Math.max(1, Math.ceil(value.n / value.d)));
	const segment = $derived((width - 4) / value.d);
	const uid = $props.id();
</script>

<div class="bars" aria-hidden="true">
	{#each Array(wholeBars) as _, b (b)}
		<svg viewBox="0 0 {width} {height}" {width} {height}>
			<defs>
				<pattern
					id="hatch-{uid}"
					width="6"
					height="6"
					patternUnits="userSpaceOnUse"
					patternTransform="rotate(45)"
				>
					<rect width="6" height="6" fill="#ffcf4d" />
					<line x1="0" y1="0" x2="0" y2="6" stroke="#e3a04f" stroke-width="2.5" />
				</pattern>
			</defs>
			{#each Array(value.d) as _, i (i)}
				{@const on = b * value.d + i < value.n}
				<rect
					x={2 + i * segment}
					y="2"
					width={segment}
					height={height - 4}
					fill={on ? `url(#hatch-${uid})` : '#fffaf2'}
					stroke="#6b3a16"
					stroke-width="1.5"
					stroke-dasharray={on ? undefined : '3 2'}
				/>
			{/each}
		</svg>
	{/each}
</div>

<style>
	.bars {
		display: flex;
		flex-direction: column;
		gap: 4px;
		align-items: center;
	}
	svg {
		display: block;
		max-width: 100%;
		height: auto;
	}
</style>
