import { Bounds } from "../../geometry/computeBounds";
import { translateContours } from "../../geometry/contourTransforms";
import { MODEL_BASE_DIAMETER_MM } from "../../geometry/studPlacement";
import { CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG } from "../../preview/svgBaseReference";
import { GRID_STEP_MM } from "../../preview/svgGrid";
import { Vec2 } from "../../types";
import { FlippedContactSheetItem } from "./types";

export const allContoursOf = (item: FlippedContactSheetItem): Vec2[][] => {
  return [item.baseContours, ...item.reliefContoursByColorGroup.values()].flat();
};

// Moves an arc token by the same fixed offset as its base-reference circle (see
// svgBaseReference.ts), so token and circle move as one piece and no shape parameter can shift
// one against the other.
export const shiftForArcAnchor = (contours: Vec2[][]): Vec2[][] => {
  return translateContours(contours, [CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG]);
};

// Where the circle always sits in an arc cell. A cell has to fit it even when the token is
// smaller.
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

// How far any arc token reaches left of (axis 0) or above (axis 1) the circle's footprint, for
// example the studs of a wide sweep. One margin for the whole sheet, the worst case, so every
// cell reserves the same space and no token moves against its own circle.
export const computeOverflowMarginMm = (arcCombinedBoundsList: Bounds[], axis: 0 | 1): number => {
  if (arcCombinedBoundsList.length === 0) {
    return 0;
  }

  return Math.max(0, ...arcCombinedBoundsList.map((bounds) => -bounds.min[axis]));
};

export const roundUpToGridStep = (valueMm: number): number => {
  return Math.ceil(valueMm / GRID_STEP_MM) * GRID_STEP_MM;
};

// Cells start on a grid line. A cell whose size is a multiple of twice the grid step has its
// center on a grid line too.
const GRID_VERTEX_STEP_MM = GRID_STEP_MM * 2;

export const roundUpToGridVertexStep = (valueMm: number): number => {
  return Math.ceil(valueMm / GRID_VERTEX_STEP_MM) * GRID_VERTEX_STEP_MM;
};
