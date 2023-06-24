export const contextual = function (
	node: HTMLElement,
	opts: {
		container: Element | Window;
		target: Element | Window | undefined;
		attach: 'top' | 'bottom' | 'left' | 'right' | 'cursor';
		align: 'start' | 'finish' | 'middle';
	}
) {
	console.log(opts.target, node.parentElement, opts.target, window);
	opts = {
		container: opts.container ?? window,
		target: opts.target ?? node.parentElement ?? opts.container ?? window,
		attach: opts.attach ?? 'cursor',
		align: opts.align ?? 'start'
	};
	const triggerOut = (event: Event) => {
		if (!node.contains(event.target as Element)) {
			node.dispatchEvent(new CustomEvent('out-action'));
		} else {
			opts.container.addEventListener('click', triggerOut, { capture: true, once: true });
			opts.container.addEventListener('contextmenu', triggerOut, { capture: true, once: true });
		}
	};

	//Using contextual menu on the object itself.
	const contextmenu = (e: MouseEvent) => {
		e.stopPropagation();
		console.log('stopped');
	};

	const redraw = (e: MouseEvent) => {
		if (e == undefined) {
			e = {
				layerX: parseInt(node.style.getPropertyValue('--layer-x')),
				layerY: parseInt(node.style.getPropertyValue('--layer-y'))
			};
		} else {
			node.style.setProperty('--layer-x', e.layerX);
			node.style.setProperty('--layer-y', e.layerY);
		}

		const w = opts.target.clientWidth;
		const h = opts.target.clientHeight;
		const x = opts.target.offsetLeft;
		const y = opts.target.offsetTop;

		const nw = node.clientWidth;
		const nh = node.clientHeight;

		let mul = 0.5;
		if (opts.align === 'start') mul = 0;
		else if (opts.align === 'finish') mul = 1;
		else if (opts.align === 'middle') mul = 0.5;
		else mul = opts.align;

		//console.log(e, opts.container)
		//console.log(e.layerY , opts.container.scrollTop)

		const clipX = (target) => {
			return (
				Math.min(
					Math.max(target, 0),
					opts.container.scrollLeft + opts.container.clientWidth - node.clientWidth
				) + 'px'
			);
		};
		const clipY = (target) => {
			return (
				Math.min(
					Math.max(target, 0),
					opts.container.scrollTop + opts.container.clientHeight - node.clientHeight
				) + 'px'
			);
		};

		//TODO test attachments!
		if (opts.attach === 'cursor') {
			node.style.setProperty('--attach-x', clipX(e.layerX - nw * mul));
			node.style.setProperty('--attach-y', clipY(e.layerY - nh * mul));
		} else if (opts.attach === 'bottom') {
			node.style.setProperty('--attach-x', clipX(x + (w - nw) * mul));
			node.style.setProperty('--attach-y', clipY(y + h));
		} else if (opts.attach === 'right') {
			node.style.setProperty('--attach-x', clipX(x + w));
			node.style.setProperty('--attach-y', clipY(y - (h - nh) * mul));
		} else if (opts.attach === 'top') {
			node.style.setProperty('--attach-x', clipX(x + (w - nw) * mul));
			node.style.setProperty('--attach-y', clipY(y - nh));
		} else if (opts.attach === 'left') {
			node.style.setProperty('--attach-x', clipX(x - nw));
			node.style.setProperty('--attach-y', clipY(y - (h - nh) * mul));
		}
	};

	//Notification of external click
	const hide = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		resizeObserver.disconnect(node);
		node.style.display = 'none';
		opts.container.removeEventListener('click', triggerOut, { capture: true, once: true });
		opts.container.removeEventListener('contextmenu', triggerOut, { capture: true, once: true });
	};

	const show = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		node.style.visibility = 'hidden';
		node.style.display = 'block';

		redraw(e);

		node.style.visibility = 'visible';

		opts.container.addEventListener('click', triggerOut, { capture: true, once: true });
		opts.container.addEventListener('contextmenu', triggerOut, { capture: true, once: true });
		resizeObserver.observe(node);
	};

	node.addEventListener('out-action', hide as EventListener);
	node.addEventListener('contextmenu', contextmenu);
	node.addEventListener('click', contextmenu);

	opts.target.addEventListener('contextmenu', show as EventListener);
	const resizeObserver = new ResizeObserver(() => {
		redraw();
	});

	return {
		destroy() {
			opts.container.removeEventListener('click', triggerOut, { capture: true, once: true });
			opts.container.removeEventListener('contextmenu', triggerOut, { capture: true, once: true });

			opts.target.removeEventListener('contextmenu', show as EventListener);
			node.removeEventListener('out-action', hide as EventListener);
			node.removeEventListener('contextmenu', contextmenu);
		},
		update(current: {
			container: Element | Window | undefined;
			target: Element | Window | undefined;
		}) {
			//console.log(current)
			current = {
				container: current.container ?? window,
				target: opts.target ?? node.parentNode ?? opts.container ?? window,
				attach: current.attach ?? 'cursor',
				align: current.align ?? 'start'
			};

			opts.container.removeEventListener('click', triggerOut, { capture: true, once: true });
			opts.container.removeEventListener('contextmenu', triggerOut, { capture: true, once: true });
			current.container.addEventListener('click', triggerOut, { capture: true, once: true });
			current.container.addEventListener('contextmenu', triggerOut, { capture: true, once: true });

			opts.target.removeEventListener('contextmenu', show as EventListener);
			current.target.addEventListener('contextmenu', show as EventListener);

			opts = current;
		}
	};
};
