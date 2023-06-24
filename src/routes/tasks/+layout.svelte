<script>
	import Layout from '$lib/components/Layout.svelte';
	import AwaitButton from '$lib/components/AwaitButton.svelte';
</script>

<Layout>
	<svelte:fragment slot="toolbar">
		<section>
			<AwaitButton tip="Graph" icon="ph:graph" />
			<AwaitButton tip="Input" icon="material-symbols:input-sharp" />
			<AwaitButton tip="Output" icon="material-symbols:output-sharp" />
		</section>

		<section>
			<AwaitButton tip="Play" icon="material-symbols:play-arrow-rounded" />
			<AwaitButton tip="Pause" icon="material-symbols:pause-rounded" />
			<AwaitButton tip="Stop" icon="material-symbols:stop-rounded" />
		</section>
	</svelte:fragment>
	<slot />
</Layout>
