<!-- Dialog to set/view the metadata of a file -->
<svelte:options accessors />

<script lang="ts">
	import Dialog from '$lib/components/Dialog.svelte';

	export let name: string =''
	export let tags: string[] = []
	export let desc: string =''

	export const data = () => {
		return root.data();
	};

	export const open = async () => {
		await root.open();
	};

	let root: Dialog;
</script>


<Dialog bind:this={root} memory={true}>

<table>
	<tr>
		<td>Name:</td><td><input name="name" bind:value={name}/></td>
		<td>Tags:</td><td><input name="tags" disabled/></td>
		<td>Description:</td><td><textarea name="desc" bind:value={desc}></textarea></td>
	</tr>
</table>
</Dialog>	