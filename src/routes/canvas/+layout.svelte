<script lang="ts">
	import Layout from '$lib/components/Layout.svelte';
	import { Canvas, Layer, t } from 'svelte-canvas';

	$: render = ({ context, width, height }) => {
		context.fillStyle = `hsl(${$t / 40}, 100%, 50%)`;
		context.beginPath();
		context.arc(($t / 4) % width, ($t / 4) % height, 100, 0, Math.PI * 2);
		context.fill();
	};
</script>

<Layout>
	<svelte:fragment slot="toolbar">
		<section>
			<h2>Canvas Section</h2>
		</section>
	</svelte:fragment>

	<svelte:fragment>
		<Canvas width={640} height={640}><Layer {render} /></Canvas>
	</svelte:fragment>
</Layout>
