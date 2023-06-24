<script context="module">
	import { dialog, Dialog } from '$lib/utils/dialogs/dialogs';
	import '$lib/utils/dialogs/dialogs.scss';
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import AwaitButton from './AwaitButton.svelte';
	import ToastArea from './ToastArea.svelte';
	import { notifications } from '$lib/utils/notify';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	let root;
	let side;
</script>

<div class="content">
	<div class="container" bind:this={root}>
		<nav class="toolbar">
			<slot name="toolbar" />
			<section style="flex-grow:2" />
			<section>
				<AwaitButton
					tip="Workflows"
					icon="carbon:ibm-process-mining"
					op={async () => goto('/workflows')}
				/>
				<AwaitButton tip="Canvas" icon="system-uicons:write" op={async () => goto('/canvas')} />
				<AwaitButton tip="Tasks" icon="carbon:task-asset-view" op={async () => goto('/tasks')} />
				<AwaitButton tip="Config" icon="mdi:gear" op={async () => goto('/settings')} />
				<AwaitButton tip="Logs" icon="icon-park-outline:log" op={async () => goto('/docs')} />

				<AwaitButton
					tip="Help"
					icon="ic:outline-live-help"
					op={async () => /*goto('/about')*/ dialog?.alert('Temporary help message')}
				/>
			</section>
		</nav>
		<main><slot /></main>
		<nav class="tabbar">
			<slot name="tabbar" />
		</nav>
	</div>
	<!-- Documentation area-->
	<div class="side" bind:this={side} />
</div>
<ToastArea />
<slot name="dialog-area" />

<style lang="scss" global>
	nav.toolbar,
	nav.tabbar {
		display: flex;
		flex-direction: row;
		//flex-wrap: wrap;
		justify-content: flex-start;
		align-items: center;
		min-height: 40px;
		line-height: 40px;
		gap: 20px;
		background-color: darkslategrey;

		* {
			margin: 0px;
			padding: 0px;
		}
		h1 {
			line-height: 40px;
			color: silver;

			display: inline-flex;
			gap: 3px;
			align-items: center;
		}
		button {
			padding: 2px 5px 2px 5px;
			border: 1px solid black;
			background-color: white;
			border-radius: 5px;
			height: 25px;

			display: inline-flex;
			gap: 3px;
			align-items: center;
		}

		& > section:first-of-type {
			padding-left: 10px;
		}
		& > section:last-of-type {
			padding-right: 10px;
		}
		& > section {
			height: 100%;
		}

		.icon {
			line-height: 100%;
		}

		svg {
			vertical-align: middle;
		}
	}

	.content {
		display: flex;
		flex-direction: row;
		--SIDE-SIZE: 0cqw;
	}

	.container {
		display: flex;
		flex-direction: column;
		background-color: transparent;
		flex-wrap: nowrap;
		align-items: stretch;
		height: 100cqh;
		justify-content: space-between;
		width: calc(100cqw - var(--SIDE-SIZE));
	}

	.side {
		display: flex;
		flex-direction: column;
		background-color: transparent;
		flex-wrap: nowrap;
		align-items: stretch;
		height: 100vh;
		justify-content: space-between;
	}

	main {
		flex-grow: 1;
		background-color: black;
		display: flex;
		flex-direction: column;
		&.hidden {
			display: none;
		}
		color: white;
		overflow: hidden;
	}
</style>
