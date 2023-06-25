<script lang="ts">
	import AwaitButton from '$lib/components/AwaitButton.svelte';
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

	const applyZoom = (e: WheelEvent) => {
		if (e.shiftKey == true) {
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
		posx = posx + (e.key == '4' ? motion : 0) - (e.key == '6' ? motion : 0);
		posy = posy + (e.key == '2' ? motion : 0) - (e.key == '8' ? motion : 0);
	};

	const updateCursor = (e: MouseEvent) => {
		brush_x = e.pageX - canvas.getBoundingClientRect().left;
		brush_y = e.pageY - canvas.getBoundingClientRect().top;
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

		context.restore();
	};
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
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
			on:wheel={(e) => applyZoom(e)}
			on:keypress={(e) => applyTranslation(e)}
			on:mousemove={(e) => updateCursor(e)}
			on:contextmenu={async (e) => {
				e.preventDefault();

				await DialogBrush.open();
			}}
			tabindex="0"
		>
			<Canvas width={w} height={h}>
				<Layer render={renderWorkspace} />

				<Layer render={renderBrush} />
			</Canvas>

			<slot />
			<div class="layers">
				<section>
					<header>
						<h4>Layers</h4>
					</header>
					<main>
						{#each grouplayers as group}
							<section class="layerGroup">
								<header>{group.title}</header>
								{#each group.items as layer}
									<!--Layer for all visible layers-->
									<section class="layer">{layer.title}</section>
								{/each}
							</section>
						{/each}
					</main>
				</section>

				<footer>
					<section>
						<Icon icon="iconoir:position" />{Math.trunc(
							(brush_x - w / 2 - posx * z) / z
						)};{Math.trunc((brush_y - h / 2 - posy * z) / z)}
					</section>
					<section><Icon icon="fontisto:zoom" />{Math.trunc(z * 100)}%</section>
					<section><Icon icon="bx:brush" />{brush_width * 64};{brush_height * 64}</section>
				</footer>
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
			<AwaitButton disabled={true} tip="Generate" icon="fontisto:export" />
			<AwaitButton disabled={true} tip="Import reference" icon="fontisto:import" />
		</section>
		<section class="genericBrushes">
			<AwaitButton disabled={true} tip="Cursor" icon="tabler:pointer" />
			<AwaitButton disabled={true} tip="Text2Image" icon="mdi:text" />
			<AwaitButton disabled={true} tip="Image2Image" icon="ph:image-duotone" />
			<AwaitButton disabled={true} tip="Enhance" icon="material-symbols:camera-enhance" />
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
	.layers:hover {
		opacity: 1;
	}
	.layers {
		opacity: 0.7;
		transition: opacity 100ms ease-in-out;
		left: 0px;
		width: 200px;
		top: 10px;
		bottom: 10px;
		background-color: darkseagreen;
		color: darkslategray;
		left: 10px;
		display: block;
		position: absolute;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;

		padding: 10px;
		gap: 10px;

		header {
			h4 {
				margin: 0px;
			}
		}
		footer {
			display: flex;
			flex-direction: column;
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
</style>
