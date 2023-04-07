<script>
	import Layout from '$lib/components/Layout.svelte';
	import AwaitButton from '$lib/components/AwaitButton.svelte';
</script>

<Layout>
	<svelte:fragment slot="toolbar">
		<section>
			<AwaitButton tip="Remove all" icon="material-symbols:tab-close-rounded" />
			<AwaitButton tip="Export" icon="fontisto:export" />

			<input type="search" />
		</section>
	</svelte:fragment>
	<svelte:fragment slot="default">
		<h1>Notification area</h1>
		List of all old notifications</svelte:fragment
	>
</Layout>
