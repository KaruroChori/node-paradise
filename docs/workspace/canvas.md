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
* SHIFT + Scroll Wheel: resize brush
* SHIFT + 3rd Button Click: restore origin and zoom
* SHIFT + 3d Button Drag: panning
* RIGHT CLICK: configuration panel for brush
* SHIFT + RIGHT CLICK: restore brush to default
* LEFT CLICK: apply brush
*
