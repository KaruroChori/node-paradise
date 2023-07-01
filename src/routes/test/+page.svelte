<!DOCTYPE html>
<!-- svelte-ignore a11y-missing-attribute -->
<html>
	<head>
		<title>Pressure-sensitive Canvas</title>
		<style>
			canvas {
				border: 1px solid #ccc;
			}
		</style>
	</head>
	<body>
		<canvas id="myCanvas" width="500" height="300" />
		<button onclick="switchToBrush()">Brush</button>
		<button onclick="switchToEraser()">Eraser</button>
		<button onclick="undo()">Undo</button>
		<button onclick="redo()">Redo</button>

		<script>
			const canvas = document.getElementById('myCanvas');
			const ctx = canvas.getContext('2d');
			let isDrawing = false;
			let currentTool = 'brush';
			let drawingHistory = [];
			let currentStep = -1;

			// Set up event listeners for the canvas
			canvas.addEventListener('pointerdown', startDrawing);
			canvas.addEventListener('pointermove', draw);
			canvas.addEventListener('pointerup', stopDrawing);

			function startDrawing(event) {
				isDrawing = true;
				ctx.beginPath();
				ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);

				// Reset the drawing history after starting a new stroke
				if (currentStep < drawingHistory.length - 1) {
					drawingHistory = drawingHistory.slice(0, currentStep + 1);
				}
			}

			function draw(event) {
				if (!isDrawing) return;

				const pressure = event.pressure || 0.5; // Default to 0.5 if pressure is not supported
				ctx.lineCap = 'round';

				if (currentTool === 'brush') {
					ctx.strokeStyle = '#000';
					ctx.lineWidth = pressure * 40; // Adjust stroke width based on pressure
				} else if (currentTool === 'eraser') {
					ctx.globalCompositeOperation = 'destination-out';
					ctx.lineWidth = pressure * 40; // Adjust eraser width based on pressure
				}

				ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);

				// Save the drawing step to the history
				const x = event.clientX - canvas.offsetLeft;
				const y = event.clientY - canvas.offsetTop;
				drawingHistory.push({ x, y, pressure });
			}

			function stopDrawing() {
				if (currentTool === 'eraser') {
					ctx.globalCompositeOperation = 'source-over';
				}
				isDrawing = false;
				currentStep++;
			}

			function switchToBrush() {
				currentTool = 'brush';
				ctx.globalCompositeOperation = 'source-over'; // Reset composite operation
			}

			function switchToEraser() {
				currentTool = 'eraser';
				ctx.globalCompositeOperation = 'destination-out'; // Set composite operation to eraser mode
			}

			function undo() {
				if (currentStep > 0) {
					currentStep--;
					redraw();
				}
			}

			function redo() {
				if (currentStep < drawingHistory.length - 1) {
					currentStep++;
					redraw();
				}
			}

			function redraw() {
				ctx.clearRect(0, 0, canvas.width, canvas.height);

				for (let i = 0; i <= currentStep; i++) {
					const { x, y, pressure } = drawingHistory[i];
					ctx.lineCap = 'round';

					if (currentTool === 'brush') {
						ctx.strokeStyle = '#000';
						ctx.lineWidth = pressure * 40;
					} else if (currentTool === 'eraser') {
						ctx.globalCompositeOperation = 'destination-out';
						ctx.lineWidth = pressure * 40;
					}

					if (i === 0) {
						ctx.beginPath();
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
						ctx.stroke();
						ctx.beginPath();
						ctx.moveTo(x, y);
					}
				}
			}
		</script>
	</body>
</html>
