<script context="module" lang="ts">
	export type Widget = {
		info: string | undefined;
		type: 'text' | 'image' | 'flag' | 'options';
		default: unknown | undefined;
		items: { key: unknown; value: unknown }[];
	};
</script>

<script lang="ts">
	export let data: { info: string; widgets: Widget[] };
</script>

<main>
	{#if data?.info != undefined}
		<h4>Info</h4>
		<p>{@html data.info}</p>
		<hr />
	{/if}
	{#each data?.widgets ?? [] as widget}
		{#if widget.type == 'text'}
			<textarea />
		{:else if widget.type == 'image'}
			<div>Image placeholder</div>
		{/if}
	{/each}
</main>

<style lang="scss">
	main {
		padding: 10px;
	}
	h4 {
		margin: 0px;
	}
	hr {
		margin: 0px;
		color: white;
		border: none;
		border-bottom: 2px solid white;
	}
</style>
