<script context="module" lang="ts">
</script>

<script lang="ts">
	import { contextual } from '../utils/contextual';
	//import ToolArea from './ToolArea.svelte';

	export let container: Element | Window | undefined = undefined;
	export let target: Element | Window | undefined = undefined;
	export let attach: 'top' | 'bottom' | 'left' | 'right' | 'cursor' = 'cursor';
	export let align: 'start' | 'finish' | 'middle' = 'start';

	export let items: unknown | undefined = undefined;
</script>

<div
	use:contextual={{ container: container, target: target, attach: attach, align: align }}
	class="contextualMenu"
>
	<!--<ToolArea flow="vertical" {items} />-->
	<slot />
</div>

<style lang="scss">
	.contextualMenu {
		--attach-x: 0;
		--attach-y: 0;
		display: none;
		position: absolute;
		margin: 0;
		left: 0;
		top: 0;
	}

	.contextualMenu {
		transform: translateX(var(--attach-x)) translateY(var(--attach-y));
		border: 1px solid black;
		background-color: white;
		border-radius: 5px;
		z-index: 10000;
	}
</style>
