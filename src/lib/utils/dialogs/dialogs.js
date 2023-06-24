import { browser } from '$app/environment';

/**
 * Dialog module.
 * @module dialog.js
 * @version 1.0.0
 * @summary 02-01-2022
 * @author Mads Stoumann
 * @description Custom versions of `alert`, `confirm` and `prompt`, using `<dialog>`
 */
export class Dialog {
	constructor(settings = {}) {
		this.settings = Object.assign(
			{
				accept: 'OK',
				bodyClass: 'dialog-open',
				cancel: 'Cancel',
				yes: 'Yes',
				no: 'No',
				dialogClass: '',
				message: '',
				soundAccept: '',
				soundOpen: '',
				template: ''
			},
			settings
		);
		this.init();
	}

	collectFormData(formData) {
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

	getFocusable() {
		return [
			...this.dialog.querySelectorAll(
				'button,[href],select,textarea,input:not([type="hidden"]),[tabindex]:not([tabindex="-1"])'
			)
		];
	}

	init() {
		this.dialogSupported = typeof HTMLDialogElement === 'function';
		this.dialog = document.createElement('dialog');
		this.dialog.role = 'dialog';
		this.dialog.dataset.component = this.dialogSupported ? 'dialog' : 'no-dialog';
		this.dialog.innerHTML = `
    <form method="dialog" data-ref="form">
      <fieldset data-ref="fieldset" role="document">
        <legend data-ref="message" id="${Math.round(Date.now()).toString(36)}"></legend>
        <div data-ref="template"></div>
      </fieldset>
      <menu>
        <button${
					this.dialogSupported ? '' : ` type="button"`
				} data-ref="cancel" value="cancel"></button>
        <button${
					this.dialogSupported ? '' : ` type="button"`
				} data-ref="accept" value="default"></button>
        <button${this.dialogSupported ? '' : ` type="button"`} data-ref="no" value="no"></button>
        <button${this.dialogSupported ? '' : ` type="button"`} data-ref="yes" value="yes"></button>	
      </menu>
      <audio data-ref="soundAccept"></audio>
      <audio data-ref="soundOpen"></audio>
    </form>`;
		document.body.appendChild(this.dialog);

		this.elements = {};
		this.focusable = [];
		this.dialog
			.querySelectorAll('[data-ref]')
			.forEach((el) => (this.elements[el.dataset.ref] = el));
		this.dialog.setAttribute('aria-labelledby', this.elements.message.id);
		this.elements.cancel.addEventListener('click', () => {
			this.dialog.dispatchEvent(new Event('cancel'));
		});
		this.dialog.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				if (!this.dialogSupported) e.preventDefault();
				this.elements.accept.dispatchEvent(new Event('click'));
			}
			if (e.key === 'Escape') this.dialog.dispatchEvent(new Event('cancel'));
			if (e.key === 'Tab') {
				e.preventDefault();
				const len = this.focusable.length - 1;
				let index = this.focusable.indexOf(e.target);
				index = e.shiftKey ? index - 1 : index + 1;
				if (index < 0) index = len;
				if (index > len) index = 0;
				this.focusable[index].focus();
			}
		});
		this.toggle();
	}

	open(settings = {}) {
		const dialog = Object.assign({}, this.settings, settings);
		this.dialog.className = dialog.dialogClass || '';
		this.elements.accept.innerText = dialog.accept;
		this.elements.accept.hidden = dialog.accept === '';
		this.elements.cancel.innerText = dialog.cancel;
		this.elements.cancel.hidden = dialog.cancel === '';
		this.elements.yes.innerText = dialog.yes;
		this.elements.yes.hidden = dialog.yes === '';
		this.elements.no.innerText = dialog.no;
		this.elements.no.hidden = dialog.no === '';
		this.elements.message.innerText = dialog.message;
		this.elements.soundAccept.src = dialog.soundAccept || '';
		this.elements.soundOpen.src = dialog.soundOpen || '';
		this.elements.target = dialog.target || '';
		this.elements.template.innerHTML = dialog.template || '';

		this.focusable = this.getFocusable();
		this.hasFormData = this.elements.fieldset.elements.length > 0;

		if (dialog.soundOpen) {
			this.elements.soundOpen.play();
		}

		this.toggle(true);

		if (this.hasFormData) {
			this.focusable[0].focus();
			this.focusable[0].select();
		} else {
			this.elements.accept.focus();
		}
	}

	toggle(open = false) {
		if (this.dialogSupported && open) this.dialog.showModal();
		if (!this.dialogSupported) {
			document.body.classList.toggle(this.settings.bodyClass, open);
			this.dialog.hidden = !open;
			if (this.elements.target && !open) {
				this.elements.target.focus();
			}
		}
	}

	waitForUser() {
		return new Promise((resolve) => {
			this.dialog.addEventListener(
				'cancel',
				() => {
					this.toggle();
					resolve(false);
				},
				{ once: true }
			);
			this.elements.accept.addEventListener(
				'click',
				() => {
					let value = this.hasFormData
						? this.collectFormData(new FormData(this.elements.form))
						: true;
					if (this.elements.soundAccept.getAttribute('src').length > 0)
						this.elements.soundAccept.play();
					this.toggle();
					resolve(value);
				},
				{ once: true }
			);
			this.elements.yes.addEventListener(
				'click',
				() => {
					let value = this.hasFormData
						? this.collectFormData(new FormData(this.elements.form))
						: { decision: 'yes' };
					if (this.elements.soundAccept.getAttribute('src').length > 0)
						this.elements.soundAccept.play();
					this.toggle();
					resolve(value);
				},
				{ once: true }
			);
			this.elements.no.addEventListener(
				'click',
				() => {
					let value = this.hasFormData
						? this.collectFormData(new FormData(this.elements.form))
						: { decision: 'no' };
					if (this.elements.soundAccept.getAttribute('src').length > 0)
						this.elements.soundAccept.play();
					this.toggle();
					resolve(value);
				},
				{ once: true }
			);
		});
	}

	alert(message, config = { target: event?.target }) {
		const settings = Object.assign({}, config, {
			yes: '',
			no: '',
			cancel: '',
			message,
			template: ''
		});
		this.open(settings);
		return this.waitForUser();
	}

	confirm(message, config = { target: event?.target }) {
		const settings = Object.assign({}, config, { yes: '', no: '', message, template: '' });
		this.open(settings);
		return this.waitForUser();
	}

	yesno(message, config = { target: event?.target }) {
		const settings = Object.assign({}, config, { accept: '', message, template: '' });
		this.open(settings);
		return this.waitForUser();
	}

	prompt(message, value, config = { target: event?.target }) {
		const template = `<label aria-label="${
			message ?? ''
		}"><input type="text" name="prompt" value="${value}"></label>`;
		const settings = Object.assign({}, config, { yes: '', no: '', message, template });
		this.open(settings);
		return this.waitForUser();
	}

	custom(template, config = { target: event?.target }) {
		const settings = Object.assign({}, config, { template });
		this.open(settings);
		return this.waitForUser();
	}
}
/**
 * @type {Dialog|undefined} dialog
 */
export let dialog = undefined;
if (browser) {
	dialog = new Dialog();
}
