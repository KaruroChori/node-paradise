<script>
	import Icon from '@iconify/svelte';
</script>

<div>
	<h1>Welcome!</h1>
	<p>
		Press the button <Icon icon="mdi:add" /> to insert a new file or <Icon
			icon="material-symbols:file-open-outline-sharp"
		/> to load some.
	</p>
</div>

<style lang="scss">
	* {
		color: white;
	}
	div {
		padding: 1cm;
	}
</style>
