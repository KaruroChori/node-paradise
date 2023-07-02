# Canvas

## Layers

## History

## Brush

- Width and Height (brushes are always rects, and masks are used to further limit their influence)
- Workflow, the program to use to compute the point selected.
- Channels: map of stacked images.

Each channel is the result of the mixing between layers of a certain group. Some of these are visible as part of the main UI, other are automatically generated when loading references or drawing masks.

One trivial channel is the current canvas window, made of all visible layers mixed.
For each channel the sampling method can be either floating or fixed depending if their attachment it to the brush or the absolute coordinate system of the canvas space.

## Shortcuts

* Scroll Wheel: zoom
* SHIFT + Scroll Wheel: resize brush or buffer
* CTRL/CTRL+Shift + Scroll Wheel: resize brush of buffer in only one dimension
* ~~SHIFT + 3rd Button Click: restore origin and zoom~~ 5 instead
* SHIFT + 3d Button Drag: panning or moving buffer
* RIGHT CLICK: execute job
* ~~SHIFT + RIGHT CLICK: restore brush to default~~ UI button for now
* ~~LEFT CLICK: apply brush~~ no action on simple click for now

## TODO

* [ ] Clone button for active buffer layer
* [ ] Sample brush from canvas to active buffer layer
* [ ] Mask paint/erase brush
* [ ] Process active buffer (controlnet preprocessing, segmentation etc)
