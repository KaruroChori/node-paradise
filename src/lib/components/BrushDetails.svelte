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

{#if data?.info != undefined}
	<h4>Info</h4>
	<p>{data.info}</p>
{/if}
{#each data?.widgets ?? [] as widget}
	{#if widget.type == 'text'}
		<textarea />
	{:else if widget.type == 'image'}
		<div>Image placeholder</div>
	{/if}
{/each}

<style lang="scss">
</style>
