import { MODEL_BASE_DIAMETER_MM } from "../geometry/nobPlacement";

export { MODEL_BASE_DIAMETER_MM };

const MODEL_RADIUS_MM = MODEL_BASE_DIAMETER_MM / 2;
const FILL_COLOR = "#808080";
const FILL_OPACITY = 0.35;

// The ribbon's inner radius is now exactly MODEL_RADIUS_MM + BASE_CLEARANCE_MM / 2 (see
// nobPlacement.ts's computeInnerRadiusMm), concentric with the same origin the arc's own polar
// geometry (nob placement, sweep angle) is built around. So the reference circle no longer
// needs computing at all: it's always drawn at a fixed local offset from that origin, chosen
// once so the circle's own footprint runs from local (0, 0) to (MODEL_BASE_DIAMETER_MM,
// MODEL_BASE_DIAMETER_MM) -- both already on 10mm grid lines. This replaces the old
// tangent-to-crest + grid-snap computation entirely: see
// docs/superpowers/specs/2026-09-02-arc-parametrization-design.md for why that's now exact by
// construction instead of approximated.
export const CIRCLE_ANCHOR_X_SVG = MODEL_RADIUS_MM;
export const CIRCLE_ANCHOR_Y_SVG = MODEL_RADIUS_MM;

// Purely a visual scale reference, never fed into any print/export contour, like the grid
// overlay it sits alongside. Solid but translucent, and always emitted before the token's own
// paths (see buildPreviewSvg.ts / contactSheetSvg.ts's paint order), so the token renders on
// top of it, not the other way around.
export const buildBaseReferenceCircleSvg = (centerXSvg: number, centerYSvg: number): string => {
  return [
    '<g data-role="base-reference-circle">',
    `<circle cx="${centerXSvg}" cy="${centerYSvg}" r="${MODEL_RADIUS_MM}" fill="${FILL_COLOR}" fill-opacity="${FILL_OPACITY}" />`,
    "</g>",
  ].join("");
};

// Callers use this to grow their viewBox/cell height so the circle never gets clipped or
// forces the token upward to make room, instead of guessing at extra padding.
export const computeBaseReferenceCircleBottomYSvg = (centerYSvg: number): number => {
  return centerYSvg + MODEL_RADIUS_MM;
};
