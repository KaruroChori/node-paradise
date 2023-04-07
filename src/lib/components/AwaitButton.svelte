<script lang="ts">
	import Icon from '@iconify/svelte';
	import { notifications } from '$lib/utils/notify';
	import { dialog } from '$lib/utils/dialogs/dialogs';

	export let op: ((e?: MouseEvent) => Promise<unknown> | void) | undefined = undefined;
	export let disabled: boolean = false;
	export let confirm: boolean | string | undefined = undefined;
	export let tip: string | undefined = undefined;
	export let icon: string | undefined = undefined;
	export let onSuccess: (() => void) | undefined = undefined;
	export let onFail: ((error: unknown) => void) | undefined = (error: any) => {
		notifications.danger(error?.msg ?? error, 3000);
	};

	let loading = false;
	//todo add class based on state, resolving, error, done
	let state = 'initial';
</script>

<button
	disabled={loading || disabled || op == undefined}
	class={state}
	on:click={async (e) => {
		if (confirm != undefined && e.shiftKey == false) {
			if ((await dialog?.confirm(confirm === true ? 'You sure?' : confirm)) == false) {
				return;
			}
		}
		loading = true;
		state = 'resolving';

		if (op != undefined)
			try {
				await op(e);
				if (onSuccess != undefined) onSuccess();
				state = 'resolved';
			} catch (e) {
				if (onFail != undefined) onFail(e);
				state = 'error';
				loading = false;
			}
		loading = false;
	}}
>
	{#if icon != undefined}<span title={tip}><Icon {icon} /></span>{/if}
	<slot />
</button>

<style lang="scss">
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

	.initial {
		background-color: white;
		color: black;
		&:active:not([disabled]) {
			background-color: gray;
			color: white;
		}
		&[disabled] {
			color: silver;
		}
	}
	.resolved {
		background-color: white; //yellowgreen;
		color: black;
		&:active:not([disabled]) {
			background-color: gray;
			color: white;
		}
		&[disabled] {
			color: silver;
		}
	}
	.error {
		background-color: darkred;
		color: white;
		&:active:not([disabled]) {
			background-color: gray;
			color: white;
		}
		&[disabled] {
			color: silver;
		}
	}
	.resolving {
		background-color: orange;
	}

	span {
		//color: Red;
		font-size: 16px;
	}

	span > :global(svg) {
		vertical-align: middle;
	}
</style>
