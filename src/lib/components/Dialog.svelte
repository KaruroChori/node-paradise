<script lang="ts">
	import { onMount } from 'svelte';

	function collectFormData(formData) {
		const object = {};
		formData.forEach((value, key) => {
			if (!Reflect.has(object, key)) {
				object[key] = value;
				return;
			}
			if (!Array.isArray(object[key])) {
				object[key] = [object[key]];
			}
			object[key].push(value);
		});
		return object;
	}

	function getFocusable() {
		return [
			...dialog.querySelectorAll(
				'button,[href],select,textarea,input:not([type="hidden"]),[tabindex]:not([tabindex="-1"])'
			)
		];
	}

	function waitForUser() {
		return new Promise((resolve) => {
			dialog.addEventListener(
				'cancel',
				() => {
					toggle();
					resolve(false);
					_data = null;
				},
				{ once: true }
			);
			accept?.addEventListener(
				'click',
				() => {
					let value = hasFormData ? collectFormData(new FormData(form)) : true;
					const sound = soundAccept.getAttribute('src');
					if (sound != null && sound.length > 0) soundAccept.play();
					toggle();
					_data = collectFormData(new FormData(form));
					resolve(value);
				},
				{ once: true }
			);
			yes?.addEventListener(
				'click',
				() => {
					let value = hasFormData ? collectFormData(new FormData(form)) : { decision: 'yes' };
					const sound = soundAccept.getAttribute('src');
					if (sound != null && sound.length > 0) soundAccept.play();
					toggle();
					_data = collectFormData(new FormData(form));
					resolve(value);
				},
				{ once: true }
			);
			no?.addEventListener(
				'click',
				() => {
					let value = hasFormData ? collectFormData(new FormData(form)) : { decision: 'no' };
					const sound = soundAccept.getAttribute('src');
					if (sound != null && sound.length > 0) soundAccept.play();
					toggle();
					_data = collectFormData(new FormData(form));
					resolve(value);
				},
				{ once: true }
			);
		});
	}

	export function open() {
		if (memory == false) form.reset();
		focusable = getFocusable() as HTMLElement[];
		console.log(form.elements);
		hasFormData = fieldset.elements.length > 0;

		toggle(true);

		if (hasFormData) {
			focusable[0].focus();
			focusable[0].select();
		} else {
			yes?.focus();
			accept?.focus();
		}
		const sound = soundAccept.getAttribute('src');
		if (sound != null && sound.length > 0) soundAccept.play();

		return waitForUser();
	}

	function toggle(open = false) {
		if (open) dialog.showModal();
	}

	let form: HTMLFormElement;
	let dialog: HTMLDialogElement;
	let fieldset: HTMLFieldSetElement;
	let accept: HTMLButtonElement;
	let cancel: HTMLButtonElement;
	let no: HTMLButtonElement;
	let yes: HTMLButtonElement;

	let soundAccept: HTMLAudioElement;
	let soundOpen: HTMLAudioElement;

	let hasFormData: boolean;

	let _data: unknown | null = null;

	export const data = () => {
		return _data;
	};

	export const formHandle = () => {
		return form;
	};

	let focusable: HTMLElement[] = [];

	onMount(() => {
		focusable = getFocusable() as HTMLElement[];
	});

	export let config = { yes: false, no: false, accept: true };
	export let memory: boolean = false;
</script>

<dialog
	role="dialog"
	data-component="dialog"
	bind:this={dialog}
	on:keydown={(e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			yes?.dispatchEvent(new Event('click'));
			accept?.dispatchEvent(new Event('click'));
		}
		if (e.key === 'Escape') dialog.dispatchEvent(new Event('cancel'));
		if (e.key === 'Tab') {
			e.preventDefault();
			const len = focusable.length - 1;
			let index = focusable.indexOf(e.target);
			index = e.shiftKey ? index - 1 : index + 1;
			if (index < 0) index = len;
			if (index > len) index = 0;
			focusable[index].focus();
		}
	}}
>
	<form method="dialog" data-ref="form" bind:this={form}>
		<fieldset bind:this={fieldset} data-ref="fieldset" role="document">
			<slot />
		</fieldset>
		<menu>
			<button
				data-ref="cancel"
				value="cancel"
				on:click={() => {
					dialog.dispatchEvent(new Event('cancel'));
				}}
				bind:this={cancel}>Cancel</button
			>
			{#if config.yes}<button data-ref="accept" value="default" bind:this={accept}>OK</button>{/if}
			{#if config.no}<button data-ref="no" value="no" bind:this={no}>No</button>{/if}
			{#if config.accept}<button data-ref="yes" value="yes" bind:this={yes}>Yes</button>{/if}
		</menu>
		<audio data-ref="soundAccept" bind:this={soundAccept} src="" />
		<audio data-ref="soundOpen" bind:this={soundOpen} src="" />
	</form>
</dialog>
