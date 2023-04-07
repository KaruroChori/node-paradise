<script>
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { notifications } from '$lib/utils/notify';
	import Icon from '@iconify/svelte';
</script>

<div class="notifications">
	{#each $notifications as notification (notification.id)}
		<div
			class={`toast toast-${notification.type}`}
			on:click={() => {
				$notifications.splice(notification.id, 1);
			}}
		>
			<div class="content">{notification.message}</div>
			{#if notification.icon}<Icon icon={notification.icon} />{/if}
		</div>
	{/each}
</div>

<style>
	.notifications {
		position: fixed;
		bottom: 40px;
		left: 10px;
		right: 10px;
		margin: 0 auto;
		padding: 0;
		z-index: 9999;
		display: flex;
		flex-direction: column-reverse;
		justify-content: flex-start;
		align-items: flex-end;
		pointer-events: none;
	}

	.toast {
		flex: 0 0 auto;
		margin-bottom: 10px;
		pointer-events: all;
		border-radius: 5px;
		min-width: calc(min(300px, 100cqw - 20px));
	}

	.toast-danger {
		background-color: #e26d69;
	}

	.toast-success {
		background-color: #84c991;
	}

	.toast-warning {
		background-color: #f0ad4e;
	}

	.toast-info {
		background-color: #5bc0de;
	}

	.toast-default {
		background-color: #aaaaaa;
	}

	.content {
		padding: 10px;
		display: block;
		color: white;
		font-weight: 500;
	}
</style>
