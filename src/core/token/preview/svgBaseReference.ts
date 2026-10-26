import { MODEL_BASE_DIAMETER_MM } from "../geometry/studPlacement";

const MODEL_RADIUS_MM = MODEL_BASE_DIAMETER_MM / 2;
const FILL_COLOR = "#808080";
const FILL_OPACITY = 0.35;

// The arc token is built around the base's center (see computeInnerRadiusMm in
// studPlacement.ts), so the reference circle sits at a fixed offset from the
// token's origin. This offset puts the circle's footprint at (0, 0) to
// (MODEL_BASE_DIAMETER_MM, MODEL_BASE_DIAMETER_MM), both on grid lines.
export const CIRCLE_ANCHOR_X_SVG = MODEL_RADIUS_MM;
export const CIRCLE_ANCHOR_Y_SVG = MODEL_RADIUS_MM;

// A visual scale reference only, never part of the printed model. Callers emit
// it before the token's paths, so the token is drawn on top.
export const buildBaseReferenceCircleSvg = (
  centerXSvg: number,
  centerYSvg: number,
): string =>
  [
    '<g data-role="base-reference-circle">',
    `<circle cx="${centerXSvg}" cy="${centerYSvg}" r="${MODEL_RADIUS_MM}" fill="${FILL_COLOR}" fill-opacity="${FILL_OPACITY}" />`,
    "</g>",
  ].join("");

// Callers use this to grow their viewBox/cell height so the circle never gets
// clipped or forces the token upward to make room, instead of guessing at extra
// padding.
export const computeBaseReferenceCircleBottomYSvg = (
  centerYSvg: number,
): number => centerYSvg + MODEL_RADIUS_MM;
