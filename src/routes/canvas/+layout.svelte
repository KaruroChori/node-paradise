<script lang="ts">
	import AwaitButton from '$lib/components/AwaitButton.svelte';
	import BrushDetails from '$lib/components/BrushDetails.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Layout from '$lib/components/Layout.svelte';
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

	const basicBrushes = [
		{ tip: 'Cursor', icon: 'tabler:pointer', data: { info: 'Hello' } },
		{ tip: 'Text2Image', icon: 'mdi:text', data: { info: 'Hell2o' } },
		{ tip: 'Image2Image', icon: 'ph:image-duotone', data: { info: 'Hello' } },
		{ tip: 'Enhance', icon: 'material-symbols:camera-enhance', data: { info: 'Hello' } },
		{ tip: 'Inpaint', icon: 'radix-icons:mask-on', data: { info: 'Hello' } }
	];

	let presetBrushes = [];

	let customBrushes = [];
	let activeBrush = basicBrushes[0];

	const applyZoom = (e: WheelEvent) => {
		e.preventDefault();
		if (e.ctrlKey == false && e.shiftKey == true) {
			if (e.deltaY > 0) {
				brush_width++;
				brush_height++;
			} else {
				brush_width--;
				brush_height--;
			}
			if (brush_width < 4) brush_width = 4;
			if (brush_height < 4) brush_height = 4;

			return;
		}
		if (e.shiftKey == true && e.ctrlKey == true) {
			if (e.deltaY > 0) {
				brush_width++;
			} else {
				brush_width--;
			}
			if (brush_width < 4) brush_width = 4;

			return;
		} else if (e.ctrlKey == true) {
			if (e.deltaY > 0) {
				brush_height++;
			} else {
				brush_height--;
			}
			if (brush_height < 4) brush_height = 4;

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

	const applyTranslation = (e: KeyboardEvent) => {
		console.log(posx, posy);

		const motion = 10 / z;
		if (e.key == '5') {
			posx = 0;
			posy = 0;
			z = 1;
			return;
		}
		/*posx = posx + (e.key == '4' ? motion : 0) - (e.key == '6' ? motion : 0);
		posy = posy + (e.key == '2' ? motion : 0) - (e.key == '8' ? motion : 0);*/
	};

	let dragXstart = 0;
	let dragYstart = 0;
	const saveDragOrigin = (e: MouseEvent) => {
		dragXstart = (e.pageX - canvas.getBoundingClientRect().left - w / 2) / z - posx;
		dragYstart = (e.pageY - canvas.getBoundingClientRect().top - h / 2) / z - posy;
	};

	const updateCursor = (e: MouseEvent) => {
		if (e.buttons == 4) {
			brush_x = e.pageX - canvas.getBoundingClientRect().left;
			brush_y = e.pageY - canvas.getBoundingClientRect().top;
			posx = (brush_x - w / 2) / z - dragXstart;
			posy = (brush_y - h / 2) / z - dragYstart;
		} else {
			brush_x = e.pageX - canvas.getBoundingClientRect().left;
			brush_y = e.pageY - canvas.getBoundingClientRect().top;
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
	let grouplayers = [
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
			on:keypress={(e) => applyTranslation(e)}
			on:mousedown={(e) => saveDragOrigin(e)}
			on:mousemove={(e) => updateCursor(e)}
			on:mouseup={(e) => updateCursor(e)}
			on:contextmenu={async (e) => {
				e.preventDefault();

				await DialogBrush.open();
			}}
		>
			<Canvas width={w} height={h}>
				<Layer render={renderWorkspace} />

				<Layer render={renderBrush} />
			</Canvas>

			<slot />
			<div class="widgets widgets-left">
				<details class="widget widget-channels">
					<summary>
						<h4>Channels</h4>
					</summary>
					<main>
						{#each grouplayers as group}
							<section class="layerGroup">
								<header>
									<span>{group.title}</span><span>
										{#if !group.visible}
											<AwaitButton disabled={true} tip="Show" icon="mdi:show" />
										{:else}
											<AwaitButton disabled={true} tip="Hide" icon="mdi:hide" />
										{/if}
										<AwaitButton disabled={true} tip="Add" icon="material-symbols:add" />
										<AwaitButton disabled={true} tip="Add" icon="material-symbols:delete" />
									</span>
								</header>
								{#each group.items as layer}
									<!--Layer for all visible layers-->
									<section class="layer">
										<span>{layer.title}</span>
										<span>
											{#if !layer.visible}
												<AwaitButton disabled={true} tip="Show" icon="mdi:show" />
											{:else}
												<AwaitButton disabled={true} tip="Hide" icon="mdi:hide" />
											{/if}
											<AwaitButton disabled={true} tip="Move Up" icon="raphael:arrowup" />
											<AwaitButton disabled={true} tip="Move Down" icon="raphael:arrowdown" />
											<AwaitButton disabled={true} tip="Add" icon="material-symbols:delete" />
										</span>
									</section>
								{/each}
							</section>
						{/each}
					</main>
				</details>

				<section class="widget widget-stats">
					<div>
						<section>
							<Icon icon="iconoir:position" />{Math.round(
								(brush_x - w / 2 - posx * z) / z
							)};{Math.trunc((brush_y - h / 2 - posy * z) / z)}
						</section>
						<section><Icon icon="fontisto:zoom" />{Math.round(z * 100)}%</section>
						<section><Icon icon="bx:brush" />{brush_width * 64};{brush_height * 64}</section>
					</div>
				</section>
			</div>

			<div class="widgets widgets-right">
				<section class="widget widget-brushes widget-basic-brushes">
					{#each basicBrushes as brush, i}
						<div
							title={brush.tip}
							class:selected={activeBrush === brush}
							on:click={(e) => (activeBrush = brush)}
						>
							<Icon icon={brush.icon} />
						</div>
					{/each}
				</section>

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

				<section class="widget widget-brush-details">
					<BrushDetails data={activeBrush?.data} />
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
		min-width: 200px;

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
		background-color: red;
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
		flex-direction: row;
		display: flex;
		padding: 5px;
		gap: 5px;

		div {
			background-color: white;
			border-radius: 100px;
			width: 15px;
			height: 15px;
			line-height: 100%;
		}

		div.selected {
			background-color: black;
			color: white;
		}
	}
</style>
