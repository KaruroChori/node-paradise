<script lang="ts">
	import { LGraph, LGraphCanvas, LiteGraph } from 'litegraph.js';
	import { browser } from '$app/environment';
	import 'litegraph.js/css/litegraph.css';
	import { onMount } from 'svelte';

	let boundaryHeight: number;
	let boundaryWidth: number;

	export let graph: LGraph;
	let canvas;

	onMount(() => {
		if (browser) {
			canvas = new LGraphCanvas(':scope canvas', graph);
		}
	});

	$: {
		if (browser) {
			console.log('ddd');
			canvas = new LGraphCanvas(':scope canvas', graph);
		}
	}
</script>

<div class:litegraph={true} bind:clientHeight={boundaryHeight} bind:clientWidth={boundaryWidth}>
	<canvas width={boundaryWidth} height={boundaryHeight} />
</div>

<style lang="scss">
	div {
		flex-grow: 1;
		overflow: hidden;
		background-color: #666666;

		&.hidden {
			display: none;
		}
	}
</style>
