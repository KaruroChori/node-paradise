<script lang="ts">
	import AwaitButton from '$lib/components/AwaitButton.svelte';
	import BrushDetails from '$lib/components/BrushDetails.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { dialog } from '$lib/utils/dialogs/dialogs';
	import { notifications } from '$lib/utils/notify';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { Canvas, Layer, t, type Render } from 'svelte-canvas';

	let canvas: HTMLElement;

	let w: number;
	let h: number;
	let z: number = 1; //Zoom level
	let posx: number = 0;
	let posy: number = 0;
	let phi: number = 0;

	let brush_width: number = 8;
	let brush_height: number = 8;
	let brush_x: number;
	let brush_y: number;

	let DialogBrush: Dialog;

	let selectedGroup;
	let selectedLayer;

	type BufferLayer = {
		imgs: HTMLImageElement[];
		current: HTMLImageElement;
		x: number;
		y: number;
		w: number;
		h: number;
	};

	let bufferLayers: BufferLayer[] = [];
	let currentBufferLayer: number | undefined = undefined;
	let bufferLayersVisible: boolean = true;

	const basicBrushes = [
		{
			tip: 'Cursor',
			mode: 'cursor',
			icon: 'tabler:pointer',
			data: { info: 'Basic cursor. No further function.' }
		},
		{
			tip: 'Draw mask',
			mode: 'cursor',
			icon: 'ic:twotone-brush',
			data: { info: 'Drawing mask on currently selected mask layer.' }
		},
		{
			tip: 'Erase mask',
			mode: 'cursor',
			icon: 'solar:eraser-bold-duotone',
			data: { info: 'Erasing mask from the currently selected mask layer.' }
		},
		{
			tip: 'Text2Image',
			mode: 'window',
			icon: 'mdi:text',
			data: {
				info: 'Use the description in the positive and negative prompts to generate a batch of images.'
			}
		},
		{
			tip: 'Image2Image',
			mode: 'window',
			icon: 'ph:image-duotone',
			data: {
				info: 'Use the description of the positive and negative prompts to generate a batch of images.<br/>However the current image will be partially reused to bias the generation.'
			}
		},
		{
			tip: 'Enhance details',
			mode: 'window',
			icon: 'material-symbols:camera-enhance',
			data: { info: 'Utility brush to enhance (or reduce) the detail for the selected region.' }
		},
		{
			tip: 'Add lights',
			mode: 'window',

			icon: 'iconoir:sun-light',
			data: { info: 'Introduce lights and shadows in the selected region.' }
		},
		{
			tip: 'Restyle',
			mode: 'window',
			icon: 'ic:twotone-style',
			data: { info: 'Restyle the region base on the prompt or use an image as reference.' }
		},

		{
			tip: 'Inpaint',
			mode: 'window',
			icon: 'radix-icons:mask-on',
			data: { info: 'Add new content keeping into account the context around.' }
		}
	];

	let presetBrushes = [];

	let customBrushes = [];
	let activeBrush = basicBrushes[0];

	const applyZoom = (e: WheelEvent) => {
		e.preventDefault();
		if (e.ctrlKey == false && e.shiftKey == true) {
			if (currentBufferLayer != undefined && bufferLayersVisible == true) {
				if (e.deltaY > 0) {
					bufferLayers[currentBufferLayer].w *= 1.1;
					bufferLayers[currentBufferLayer].h *= 1.1;
				} else {
					bufferLayers[currentBufferLayer].w /= 1.1;
					bufferLayers[currentBufferLayer].h /= 1.1;
				}
			} else {
				if (e.deltaY > 0) {
					brush_width++;
					brush_height++;
				} else {
					brush_width--;
					brush_height--;
				}
				if (brush_width < 4) brush_width = 4;
				if (brush_height < 4) brush_height = 4;
			}
			return;
		}
		if (e.shiftKey == true && e.ctrlKey == true) {
			if (currentBufferLayer != undefined && bufferLayersVisible == true) {
				if (e.deltaY > 0) {
					bufferLayers[currentBufferLayer].w *= 1.1;
				} else {
					bufferLayers[currentBufferLayer].w /= 1.1;
				}
			} else {
				if (e.deltaY > 0) {
					brush_width++;
				} else {
					brush_width--;
				}
				if (brush_width < 4) brush_width = 4;
			}
			return;
		} else if (e.ctrlKey == true) {
			if (currentBufferLayer != undefined && bufferLayersVisible == true) {
				if (e.deltaY > 0) {
					bufferLayers[currentBufferLayer].h *= 1.1;
				} else {
					bufferLayers[currentBufferLayer].h /= 1.1;
				}
			} else {
				if (e.deltaY > 0) {
					brush_height++;
				} else {
					brush_height--;
				}
				if (brush_height < 4) brush_height = 4;
			}
			return;
		}

		if (e.deltaY > 0) {
			if (z * 1.1 > 5.2) {
				return;
			}
			//const xbs = (brush_x - w / 2 - posx) / z;
			//console.log(xbs);
			z *= 1.1;
			posx += (-(brush_x - w / 2) * 0.1) / z;
			posy += (-(brush_y - h / 2) * 0.1) / z;
		} else {
			if (z / 1.1 < 0.1) {
				return;
			}
			posx += (-(brush_x - w / 2) * -0.1) / z;
			posy -= (-(brush_y - h / 2) * 0.1) / z;
			z /= 1.1;
		}
	};

	const keyBindings = (e: KeyboardEvent) => {
		console.log(posx, posy);

		const motion = 10 / z;
		if (e.key == '5') {
			posx = 0;
			posy = 0;
			z = 1;
		} else if (e.key === 'Escape') {
			currentBufferLayer = undefined;
		} else if (
			e.key === 'Delete' &&
			currentBufferLayer != undefined &&
			bufferLayersVisible == true
		) {
			bufferLayers.splice(bufferLayers.indexOf(currentBufferLayer), 1);
			currentBufferLayer = undefined;
			bufferLayers = bufferLayers;
		} else if (e.key === 'l') {
			//TODO: open close layer widget
		}
		//TODO: With shift work on layers and not buffer layer. With control also move them around.
		//TODO: Tab/ShiftTab for navigating alt images in the same buffer layer
		else if (e.key === 'PageUp') {
			if (currentBufferLayer == undefined && bufferLayers.length != 0)
				currentBufferLayer = bufferLayers.length - 1;
			else if (currentBufferLayer != undefined && currentBufferLayer > 0) currentBufferLayer--;
		} else if (e.key === 'PageDown') {
			if (currentBufferLayer == undefined && bufferLayers.length != 0) currentBufferLayer = 0;
			else if (currentBufferLayer != undefined && currentBufferLayer + 1 < bufferLayers.length)
				currentBufferLayer++;
		}
		/*posx = posx + (e.key == '4' ? motion : 0) - (e.key == '6' ? motion : 0);
		posy = posy + (e.key == '2' ? motion : 0) - (e.key == '8' ? motion : 0);*/
	};

	let dragXstart = 0;
	let dragYstart = 0;
	const saveDragOrigin = (e: MouseEvent) => {
		if (currentBufferLayer != undefined && bufferLayersVisible == true) {
			dragXstart =
				-bufferLayers[currentBufferLayer].x +
				(e.pageX - canvas.getBoundingClientRect().left - w / 2) / z;
			dragYstart =
				-bufferLayers[currentBufferLayer].y +
				(e.pageY - canvas.getBoundingClientRect().top - h / 2) / z;
		} else {
			dragXstart = (e.pageX - canvas.getBoundingClientRect().left - w / 2) / z - posx;
			dragYstart = (e.pageY - canvas.getBoundingClientRect().top - h / 2) / z - posy;
		}
	};

	const updateCursor = (e: MouseEvent) => {
		if (e.buttons == 4 && currentBufferLayer != undefined && bufferLayersVisible == true) {
			brush_x = e.pageX - canvas.getBoundingClientRect().left;
			brush_y = e.pageY - canvas.getBoundingClientRect().top;
			bufferLayers[currentBufferLayer].x = -(dragXstart - (brush_x - w / 2) / z);
			bufferLayers[currentBufferLayer].y = -(dragYstart - (brush_y - h / 2) / z);
		} else if (e.buttons == 4) {
			brush_x = e.pageX - canvas.getBoundingClientRect().left;
			brush_y = e.pageY - canvas.getBoundingClientRect().top;
			posx = (brush_x - w / 2) / z - dragXstart;
			posy = (brush_y - h / 2) / z - dragYstart;
		} else {
			brush_x = e.pageX - canvas.getBoundingClientRect().left;
			brush_y = e.pageY - canvas.getBoundingClientRect().top;
		}
	};

	const execute = (e: MouseEvent) => {
		notifications.danger('Rendering action not yet implemented.', 1500);
	};

	const addBufferLayer = (image: HTMLImageElement) => {
		const t = {
			title: image.title,
			imgs: [image],
			current: image,
			x: -posx,
			y: -posy,
			w: image.width,
			h: image.height,
			visible: true
		};
		bufferLayers.push(t);
		currentBufferLayer = bufferLayers.length - 1;
		bufferLayers = bufferLayers;
	};

	const addImage = (e) => {
		const files = e.target.files;

		for (const i of files) {
			console.log(i);
			let reader = new FileReader();
			let image = new Image();
			reader.onload = function (event) {
				image.onload = function () {
					addBufferLayer(image);
					notifications.success('Image loaded', 1500);
				};
				image.src = event?.target?.result?.toString() ?? '';
				image.title = e?.target?.files[0].name;
			};
			reader.readAsDataURL(i);
		}
	};

	const snap = function (value, increment) {
		return Math.round(value / increment) * increment;
	};

	const checkboardImg = new Image();

	onMount(() => {
		checkboardImg.src = '/checkboard.svg';
	});

	let renderWorkspace: Render;
	let renderBrush: Render;
	let groupLayers = [
		{ title: 'Main', items: [{ title: 'A' }, { title: 'B' }] },
		{ title: 'Masks', items: [{ title: 'B' }, { title: 'B' }, { title: 'd' }] }
	];

	$: renderWorkspace = ({ context: context, width, height }) => {
		context.save();

		context.fillStyle = `rgb(255,255,255)`;
		context.fillRect(0, 0, width, height);

		//Coordinate transformations
		context.translate(width / 2, height / 2);
		context.scale(z, z);
		context.translate(posx, posy);
		context.rotate(phi);

		//Basic canvas

		context.fillStyle = `hsl(${$t / 20}, 60%, 50%)`;

		const ptrn = context.createPattern(checkboardImg, 'repeat');
		context.fillStyle = ptrn;
		context.beginPath();

		context.fillRect(-width / 2 / z - posx, -height / 2 / z - posy, width / z, height / z);

		context.fill();

		context.fillStyle = `hsl(${$t / 40}, 100%, 100%)`;
		context.beginPath();
		context.rect(10, 10, w - 20, h - 20);
		context.fill();
		context.fillStyle = `hsl(${$t / 40}, 100%, 50%)`;
		context.beginPath();
		context.arc(($t / 4) % width, ($t / 4) % height, 100, 0, Math.PI * 2);
		context.fill();
		context.restore();
	};

	$: renderBuffers = ({ context: context, width, height }) => {
		if (bufferLayersVisible == false) return;

		context.save();

		//Coordinate transformations
		context.translate(width / 2, height / 2);
		context.scale(z, z);
		context.translate(posx, posy);
		context.rotate(phi);

		for (const buffer of bufferLayers) {
			if (buffer.visible) {
				if (buffer != bufferLayers[currentBufferLayer])
					context.drawImage(
						buffer.current,
						buffer.x - buffer.w / 2,
						buffer.y - buffer.h / 2,
						buffer.w,
						buffer.h
					);
			}
		}

		if (currentBufferLayer != undefined && bufferLayers[currentBufferLayer].visible) {
			const buffer = bufferLayers[currentBufferLayer];
			//Cursor variable frame.
			context.strokeStyle = `hsl(${$t / 40}, 100%, 30%)`;
			context.beginPath();
			context.rect(buffer.x - buffer.w / 2, buffer.y - buffer.h / 2, buffer.w, buffer.h);
			context.lineWidth = 10 / z;
			context.stroke();

			context.drawImage(
				buffer.current,
				buffer.x - buffer.w / 2,
				buffer.y - buffer.h / 2,
				buffer.w,
				buffer.h
			);
		}

		context.restore();
	};

	$: renderBrush = ({ context: context, width, height }) => {
		context.save();

		//Coordinate transformations
		context.translate(width / 2, height / 2);
		context.scale(z, z);
		context.translate(posx, posy);
		context.rotate(phi);

		/*BRUSH*/

		context.translate(
			snap((brush_x - width / 2) / z - posx, 1),
			snap((brush_y - height / 2) / z - posy, 1)
		);

		if (activeBrush.mode == 'window') {
			//Cursor variable frame.
			context.strokeStyle = `hsl(${$t / 40}, 100%, 30%)`;
			context.beginPath();
			context.rect(
				-(brush_width * 64) / 2,
				-(brush_height * 64) / 2,
				brush_width * 64,
				brush_height * 64
			);
			context.lineWidth = 5 / z;
			context.stroke();
		} else if (activeBrush.mode == 'cursor') {
			context.strokeStyle = `hsl(${$t / 40}, 100%, 30%)`;
			context.beginPath();
			context.arc(0, 0, (8 * 4) / z, 0, 2 * Math.PI);
			context.lineWidth = 5 / z;

			context.stroke();

			context.beginPath();
			context.arc(0, 0, (8 * 3) / z, 0, Math.PI);
			context.lineWidth = 3 / z;
			context.stroke();

			context.beginPath();
			context.fillStyle = `hsla(${$t / 40}, 100%, 30%,0.5)`;

			context.arc(0, 0, brush_width * 6, 0, 2 * Math.PI, true);
			context.lineWidth = 3 / z;
			context.fill();
		}
		//Cursor fixed frame. Used to have data shown without scale
		/*
		context.fillStyle = `hsla(${$t / 40}, 100%, 0%,0.66)`;
		context.beginPath();
		context.rect(
			-(brush_width * 64) / z / 2,
			-(brush_height * 64) / z / 2,
			(brush_width * 64) / z,
			(brush_height * 64) / z
		);
		context.stroke();
		context.fill();

		context.fillStyle = `hsl(${$t / 40}, 100%, 100%)`;
		context.font = `${20 / z}px Mono`;
		context.fillText(
			`${brush_width * 64}x${brush_height * 64}`,
			(-(brush_width * 64) / 2 + 5) / z,
			((brush_height * 64) / 2 - 10) / z
		);
        */
		context.restore();
	};
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<Layout>
	<svelte:fragment slot="toolbar">
		<section>
			<AwaitButton disabled={true} tip="New" icon="material-symbols:add-box-outline" />
			<AwaitButton disabled={true} tip="Load" icon="material-symbols:file-open-outline-sharp" />
		</section>
		<section>
			<h2>Canvas Section</h2>
		</section>
	</svelte:fragment>

	<svelte:fragment>
		<div
			class="canvas"
			bind:this={canvas}
			bind:clientWidth={w}
			bind:clientHeight={h}
			tabindex="0"
			on:wheel={(e) => applyZoom(e)}
			on:keydown={(e) => console.log(e)}
			on:keyup={(e) => keyBindings(e)}
			on:mousedown={(e) => saveDragOrigin(e)}
			on:mousemove={(e) => updateCursor(e)}
			on:mouseup={(e) => updateCursor(e)}
			on:contextmenu={async (e) => {
				//e.preventDefault();
				execute(e);
				/*e.preventDefault();

				await DialogBrush.open();*/
			}}
		>
			<Canvas width={w} height={h} style="cursor: none;">
				<Layer render={renderWorkspace} />
				<Layer render={renderBuffers} />
				<Layer render={renderBrush} />
			</Canvas>

			<slot />
			<div class="widgets widgets-left">
				<details class="widget widget-channels" open>
					<summary>
						<h4>Channels</h4>
					</summary>
					<main>
						{#each groupLayers as group}
							<section class="layerGroup">
								<header>
									<span class="title"><a>{group.title}</a></span><span>
										{#if !group.visible}
											<AwaitButton disabled={true} tip="Show" icon="mdi:show" />
										{:else}
											<AwaitButton disabled={true} tip="Hide" icon="mdi:hide" />
										{/if}
										<AwaitButton disabled={true} tip="Add" icon="material-symbols:add" />
										<AwaitButton disabled={true} tip="Delete" icon="material-symbols:delete" />
									</span>
								</header>
								{#each group.items as layer, i}
									<!--Layer for all visible layers-->
									<section
										class="layer"
										on:dblclick={async () => {
											layer.title =
												(await dialog?.prompt('Input filename', layer.title)).prompt ?? layer.title;
											groupLayers = groupLayers;
										}}
									>
										<span class="title"><a>{layer.title}</a></span>
										<span>
											{#if !layer.visible}
												<AwaitButton tip="Show" icon="mdi:show" />
											{:else}
												<AwaitButton tip="Hide" icon="mdi:hide" />
											{/if}
											<AwaitButton
												disabled={i == 0}
												op={() => {
													const tmp = group.items[i - 1];
													group.items[i - 1] = group.items[i];
													group.items[i] = tmp;
												}}
												tip="Move Up"
												icon="raphael:arrowup"
											/>
											<AwaitButton
												disabled={i + 1 == group.items.length}
												op={() => {
													const tmp = group.items[i];
													group.items[i] = group.items[i + 1];
													group.items[i + 1] = tmp;
												}}
												tip="Move Down"
												icon="raphael:arrowdown"
											/>
											<AwaitButton
												op={() => {
													group.items.splice(i, 1);
													groupLayers = groupLayers;
												}}
												tip="Delete"
												icon="material-symbols:delete"
											/>
										</span>
									</section>
								{/each}
							</section>
						{/each}
					</main>
				</details>
				<details class="widget widget-buffers" open>
					<summary>
						<h4>Buffers</h4>
						<span>
							{#if currentBufferLayer != undefined && bufferLayersVisible == true}
								<AwaitButton
									tip="Clone"
									op={() => {
										notifications.warning('Not implemented yet', 1500);
									}}
									icon="cil:clone"
								/>
								<AwaitButton
									tip="Merge to New Mask Layer"
									op={() => {
										notifications.warning('Not implemented yet', 1500);
									}}
									icon="ic:round-merge"
								/>
								<AwaitButton
									tip="Merge to New Layer"
									op={() => {
										notifications.warning('Not implemented yet', 1500);
									}}
									icon="ic:round-merge"
								/>
							{/if}

							{#if !bufferLayersVisible}
								<AwaitButton
									tip="Show all"
									op={() => {
										bufferLayersVisible = true;
									}}
									icon="mdi:show"
								/>
							{:else}
								<AwaitButton
									tip="Hide all"
									op={() => {
										bufferLayersVisible = false;
									}}
									icon="mdi:hide"
								/>
							{/if}
						</span>
					</summary>
					{#if bufferLayers.length != 0}
						<main>
							{#each bufferLayers as bufferLayer, i}
								<section
									class="layer"
									on:click={() => {
										currentBufferLayer = i;
									}}
									on:dblclick={async () => {
										bufferLayer.title =
											(await dialog?.prompt('Input filename', bufferLayer.title)).prompt ??
											bufferLayer.title;
										bufferLayers = bufferLayers;
									}}
								>
									<span class="title">
										<a>{currentBufferLayer == i ? '*' : ''}{bufferLayer.title}</a>
									</span>
									<span>
										{#if !bufferLayer.visible}
											<AwaitButton
												tip="Show"
												op={() => (bufferLayer.visible = true)}
												icon="mdi:show"
											/>
										{:else}
											<AwaitButton
												tip="Hide"
												op={() => {
													bufferLayer.visible = false;
													currentBufferLayer = undefined;
												}}
												icon="mdi:hide"
											/>
										{/if}
										<AwaitButton
											disabled={i == 0}
											op={() => {
												const tmp = bufferLayers[i - 1];
												bufferLayers[i - 1] = bufferLayers[i];
												bufferLayers[i] = tmp;
											}}
											tip="Move Up"
											icon="raphael:arrowup"
										/>
										<AwaitButton
											disabled={i + 1 == bufferLayers.length}
											op={() => {
												const tmp = bufferLayers[i];
												bufferLayers[i] = bufferLayers[i + 1];
												bufferLayers[i + 1] = tmp;
											}}
											tip="Move Down"
											icon="raphael:arrowdown"
										/>
										<AwaitButton
											op={() => {
												if (currentBufferLayer == i) currentBufferLayer = undefined;

												bufferLayers.splice(i, 1);
												bufferLayers = bufferLayers;
											}}
											tip="Delete"
											icon="material-symbols:delete"
										/>
									</span>
								</section>
							{/each}
						</main>
					{/if}
				</details>

				<section style="flex-grow:1;" />
				{#if currentBufferLayer != undefined}
					<section class="widget widget-stats">
						<div>
							<section>
								<Icon icon="iconoir:position" />{Math.round(
									bufferLayers[currentBufferLayer]?.x ?? 0
								)};{Math.round(bufferLayers[currentBufferLayer]?.y ?? 0)}
							</section>
							<section>
								<Icon icon="bx:brush" />{Math.round(
									bufferLayers[currentBufferLayer].w
								)};{Math.round(bufferLayers[currentBufferLayer].h)}
							</section>
						</div>
					</section>
				{/if}
				<section class="widget widget-stats">
					<div>
						<section>
							<Icon icon="iconoir:position" />{Math.round(
								(brush_x - w / 2 - posx * z) / z
							)};{Math.round((brush_y - h / 2 - posy * z) / z)}
						</section>
						<section><Icon icon="fontisto:zoom" />{Math.round(z * 100)}%</section>
						<section><Icon icon="bx:brush" />{brush_width * 64};{brush_height * 64}</section>
					</div>
				</section>
			</div>

			<div class="widgets widgets-right">
				<section class="widget widget-brushes widget-basic-brushes">
					<div>
						{#each basicBrushes as brush, i}
							<div
								title={brush.tip}
								class:selected={activeBrush === brush}
								class="brush"
								class:brush-cursor={brush.mode == 'cursor'}
								on:click={(e) => (activeBrush = brush)}
							>
								<Icon icon={brush.icon} />
							</div>
						{/each}
					</div>
				</section>
				{#if customBrushes.length != 0}
					<section class="widget widget-brushes widget-custom-brushes">
						{#each customBrushes as brush, i}
							<div
								title={brush.tip}
								class:selected={activeBrush === brush}
								on:click={(e) => (activeBrush = brush)}
							>
								<Icon icon={brush.icon} />
							</div>
						{/each}
					</section>
				{/if}
				{#if presetBrushes.length != 0}
					<section class="widget widget-brushes widget-preset-brushes">
						{#each presetBrushes as brush, i}
							<div
								title={brush.tip}
								class:selected={activeBrush === brush}
								on:click={(e) => (activeBrush = brush)}
							>
								<Icon icon={brush.icon} />
							</div>
						{/each}
					</section>
				{/if}

				<section class="widget widget-brush-details">
					<BrushDetails data={activeBrush?.data} />
				</section>

				<section class="widget widget-buttons">
					<button>Apply default values</button>
					<button>Add to presets</button>
				</section>
			</div>
		</div>
	</svelte:fragment>

	<svelte:fragment slot="tabbar">
		<section>
			<AwaitButton disabled={true} tip="Save" icon="material-symbols:save" />
			<AwaitButton disabled={true} tip="Close" icon="mdi:close-box" />
			<AwaitButton disabled={true} tip="Delete" icon="material-symbols:delete-outline" />
		</section>
		<section>
			<AwaitButton disabled={true} tip="Upscale" icon="mdi:arrow-up-bold" />
			<AwaitButton disabled={true} tip="Generate" icon="fontisto:export" />
			<input type="file" accept="image/*" on:input={addImage} multiple />

			<AwaitButton disabled={true} tip="Import reference" icon="fontisto:import" />
		</section>
		<!--
		<section class="globalStyles">
			<select>
				<option>Sci-fi</option>
				<option>Streampunk</option>
			</select>
			<select>
				<option>Pastel</option>
				<option>Streampunk</option>
			</select>
		</section>
        -->
		<section class="customBrushes">a</section>
	</svelte:fragment>

	<svelte:fragment slot="dialog-area">
		<Dialog bind:this={DialogBrush}>
			<div class="brushConfig">
				<h1>Brush settings</h1>
				<label>Positive: <textarea /></label>
				<label>Negative: <textarea /></label>
				<details>
					<summary>Sampler</summary>
					<label>Boring config: <input name="hello" /></label>
				</details>

				<label>Option: <input name="hello" /></label>
			</div>
		</Dialog>
	</svelte:fragment>
</Layout>

<style lang="scss">
	.widgets {
		top: 10px;
		bottom: 10px;
		position: absolute;
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		gap: 10px;
	}

	.widgets-left {
		left: 10px;
		justify-content: space-between;

		.widget {
			margin-right: 10px;
		}
	}

	.widgets-right {
		right: 10px;

		.widget {
			margin-left: 10px;
		}
	}

	.widget:hover {
		opacity: 1;
	}
	.widget {
		min-width: 300px;
		max-width: 300px;

		opacity: 0.7;

		transition: opacity 100ms ease-in-out;

		background-color: darkseagreen;
		color: darkslategray;
		display: block;
		border-radius: 10px;
		display: flex;
		flex-direction: column;

		gap: 10px;

		max-height: 100%;
		overflow: auto;

		& > * {
			padding: 10px;
		}

		h4 {
			margin: 0px;
		}

		summary {
			position: sticky;
			top: 0px;
			background-color: darkseagreen;
		}

		::marker {
			color: red;
			marker: none;
			content: '';
		}
	}

	.canvas {
		background-color: white;
		width: 100%;
		height: 100%;
	}

	.brushConfig {
		display: flex;
		flex-direction: column;

		h1 {
			margin-top: 0px;
		}
	}

	.layerGroup header,
	.layerGroup section.layer {
		display: flex;
		justify-content: space-between;

		span {
			display: flex;
			gap: 5px;
		}
	}

	.layerGroup section.layer {
		padding-left: 10px;
	}

	.widget-brushes {
		align-items: center;
		& > div {
			flex-wrap: wrap;

			padding: 5px;
			flex-direction: row;
			display: flex;
			gap: 5px;
		}

		& > div > div {
			background-color: white;
			border-radius: 10px;
			width: 35px;
			height: 35px;
			line-height: 40px;
			text-align: center;

			&.brush-cursor {
				border-radius: 100px;
			}
		}

		& > div > div.selected {
			background-color: black;
			color: white;
		}
	}

	.widget-buttons {
		gap: 0px;
		& > button {
			&:first-of-type {
				border-top-left-radius: 10px;
				border-top-right-radius: 10px;
			}

			&:last-of-type {
				border-bottom-left-radius: 10px;
				border-bottom-right-radius: 10px;
				border: 2px solid black;
			}
			color: black;
			background-color: white;
			border: none;
			border: 2px solid black;
			border-bottom: 0px;
			&:hover {
				color: darkslategray;
			}
			&:active {
				color: white;
				background-color: darkslategray;
			}
		}
	}

	.title {
		min-width: 0;
		& > a {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	details.widget {
		& > summary {
			display: flex;
			justify-content: space-between;
			align-items: baseline;
		}
		& > main > .layer {
			display: flex;
			justify-content: space-between;
			align-items: baseline;
			gap: 5px;

			& > span {
				display: flex;
				justify-content: space-between;
				align-items: baseline;
				gap: 5px;
			}
		}
	}

	.widget-stats > div > section {
		display: flex;
		gap: 10px;
	}
</style>
