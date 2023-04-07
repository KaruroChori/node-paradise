<!-- File list to select which one to open -->
<svelte:options accessors />

<script lang="ts">
	import Dialog from '$lib/components/Dialog.svelte';
	import { stop_propagation } from 'svelte/internal';

	export let files = [
		{ name: 'Hello', uid: 'n0', tags: ['a', 'b', 'c'] },
		{ name: 'World', uid: 'n1', tags: ['a', 'b'] }
	];

	export const data = () => {
		return root.data();
	};

	export const open = async () => {
		await root.open();
	};

	let root: Dialog;
</script>

<Dialog bind:this={root}>
	<table>
		<thead>
			<tr><th>Select</th><th>Name</th><th>Description</th><th>Tags</th></tr>
		</thead>
		<tbody>
			{#each files as file}
				<tr
					on:click={(e) => {
						root.formHandle().elements[file.uid].checked =
							!root.formHandle().elements[file.uid].checked;
					}}
				>
					<td
						><input
							type="checkbox"
							name={file.uid}
							value={true}
							on:click={(e) => {
								e.stopPropagation();
							}}
						/></td
					><td>{file.name}</td><td>{file.desc ?? ''}</td><td>
						<ul class="tags">
							{#each file.tags as tag}<li>tag</li>{/each}
						</ul>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</Dialog>

<style lang="scss">
	table {
		min-width: min(100cqw, 800px);
	}
	ul.tags {
		display: flex;
		gap: 5px;
		list-style-type: none;
		padding: 0px;
		margin: 0px;
		& > li {
			color: white;
			background-color: gray;
			border-radius: 3px;
			padding: 3px 6px;
			font-size: small;
			line-height: 100%;
		}
	}
</style>
