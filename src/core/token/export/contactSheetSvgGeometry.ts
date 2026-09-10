import { Bounds } from "../geometry/computeBounds";
import { translateContours } from "../geometry/contourTransforms";
import { MODEL_BASE_DIAMETER_MM } from "../geometry/studPlacement";
import { CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG } from "../preview/svgBaseReference";
import { GRID_STEP_MM } from "../preview/svgGrid";
import { Vec2 } from "../types";
import { FlippedContactSheetItem } from "./contactSheetSvgTypes";

export const allContoursOf = (item: FlippedContactSheetItem): Vec2[][] => {
  return [item.baseContours, ...item.reliefContoursByColorGroup.values()].flat();
};

// For an arc item, the token's own local origin -- and therefore the base-reference circle,
// always drawn CIRCLE_ANCHOR_X_SVG/CIRCLE_ANCHOR_Y_SVG away from it -- is fixed relative to
// the item's own contours (see svgBaseReference.ts). Shifting a token's contours by this fixed
// amount places its origin at (CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG) in a local frame
// shared by every arc cell, so changing any shape parameter never moves the circle relative to
// the token: they're the same rigid unit now, unlike the old tangent+snap approach this
// replaces.
export const shiftForArcAnchor = (contours: Vec2[][]): Vec2[][] => {
  return translateContours(contours, [CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG]);
};

// The circle is always drawn at this fixed local footprint (see shiftForArcAnchor above), no
// matter how small an item's own contours are -- a cell must be big enough for the circle
// itself, not just whatever content happens to be smaller than it.
export const CIRCLE_FOOTPRINT_BOUNDS: Bounds = {
  min: [0, 0],
  max: [MODEL_BASE_DIAMETER_MM, MODEL_BASE_DIAMETER_MM],
};

export const unionBounds = (a: Bounds, b: Bounds): Bounds => {
  return {
    min: [Math.min(a.min[0], b.min[0]), Math.min(a.min[1], b.min[1])],
    max: [Math.max(a.max[0], b.max[0]), Math.max(a.max[1], b.max[1])],
  };
};

// The fixed anchor above still leaves an arc item free to have real content (e.g. a wide
// sweep's studs) to the left of, or above, the circle's own local footprint (which always runs
// from local (0, 0) to (MODEL_BASE_DIAMETER_MM, MODEL_BASE_DIAMETER_MM)). Rather than compute a
// per-item margin for that -- the exact pattern that caused the original bug -- one shared
// margin covers the worst case across every arc item in the sheet, the same "Math.max over all
// items" shape cellWidthMm/cellHeightMm already use below. A margin computed this way still
// can't let one item's own parameter change move it relative to its own circle: it can only
// grow the one shared margin every cell reserves, uniformly.
export const computeOverflowMarginMm = (arcCombinedBoundsList: Bounds[], axis: 0 | 1): number => {
  if (arcCombinedBoundsList.length === 0) {
    return 0;
  }

  return Math.max(0, ...arcCombinedBoundsList.map((bounds) => -bounds.min[axis]));
};

export const roundUpToGridStep = (valueMm: number): number => {
  return Math.ceil(valueMm / GRID_STEP_MM) * GRID_STEP_MM;
};

// Twice the grid step: a cell's own center only lands exactly on a grid intersection when both
// the cell's origin (always a multiple of GRID_STEP_MM, see layoutGridSection) and its size are
// multiples of GRID_VERTEX_STEP_MM, since half of a GRID_VERTEX_STEP_MM-sized cell is itself a
// whole multiple of GRID_STEP_MM.
export const GRID_VERTEX_STEP_MM = GRID_STEP_MM * 2;

export const roundUpToGridVertexStep = (valueMm: number): number => {
  return Math.ceil(valueMm / GRID_VERTEX_STEP_MM) * GRID_VERTEX_STEP_MM;
};
