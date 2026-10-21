import { describe, expect, it } from "vitest";
import type { Bounds } from "../../geometry/computeBounds";
import {
  CIRCLE_ANCHOR_X_SVG,
  CIRCLE_ANCHOR_Y_SVG,
} from "../../preview/svgBaseReference";
import { GRID_STEP_MM } from "../../preview/svgGrid";
import {
  allContoursOf,
  computeOverflowMarginMm,
  roundUpToGridStep,
  roundUpToGridVertexStep,
  shiftForArcAnchor,
  unionBounds,
} from "./geometry";
import type { FlippedContactSheetItem } from "./types";

const GRID_VERTEX_STEP_MM = GRID_STEP_MM * 2;
// Just past a grid line, so the value has to round up to the next one.
const JUST_PAST_MM = 0.1;

type BoxCorners = { minX: number; minY: number; maxX: number; maxY: number };

const box = ({ minX, minY, maxX, maxY }: BoxCorners): Bounds => ({
  min: [minX, minY],
  max: [maxX, maxY],
});

describe("allContoursOf", () => {
  it("lists the base contours followed by every color group's relief", () => {
    const item: FlippedContactSheetItem = {
      shape: { type: "disc", diameterMm: 10 },
      baseContours: [[[0, 0]]],
      reliefContoursByColorGroup: new Map([
        ["base", [[[1, 1]]]],
        ["text", [[[2, 2]]]],
      ]),
    };

    expect(allContoursOf(item)).toEqual([[[0, 0]], [[1, 1]], [[2, 2]]]);
  });
});

describe("shiftForArcAnchor", () => {
  it("moves the token's origin onto the circle's fixed anchor", () => {
    expect(shiftForArcAnchor([[[0, 0]]])).toEqual([
      [[CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG]],
    ]);
  });
});

describe("unionBounds", () => {
  it("covers both boxes", () => {
    const union = unionBounds(
      box({ minX: 0, minY: 5, maxX: 10, maxY: 6 }),
      box({ minX: -2, minY: 0, maxX: 3, maxY: 8 }),
    );

    expect(union).toEqual(box({ minX: -2, minY: 0, maxX: 10, maxY: 8 }));
  });
});

describe("computeOverflowMarginMm", () => {
  it("is zero with no arc items", () => {
    expect(computeOverflowMarginMm([], 0)).toBe(0);
  });

  it("is zero when nothing reaches past the origin", () => {
    const insideOrigin = box({ minX: 2, minY: 3, maxX: 9, maxY: 9 });

    expect(computeOverflowMarginMm([insideOrigin], 0)).toBe(0);
  });

  it("covers the item reaching furthest past the origin on the given axis", () => {
    const furthestLeft = box({ minX: -3, minY: -1, maxX: 9, maxY: 9 });
    const furthestDown = box({ minX: -1, minY: -6, maxX: 9, maxY: 9 });
    const boundsList = [furthestLeft, furthestDown];

    expect(computeOverflowMarginMm(boundsList, 0)).toBe(-furthestLeft.min[0]);
    expect(computeOverflowMarginMm(boundsList, 1)).toBe(-furthestDown.min[1]);
  });
});

describe("roundUpToGridStep", () => {
  it("rounds up to the next grid line and keeps a value already on one", () => {
    expect(roundUpToGridStep(GRID_STEP_MM + JUST_PAST_MM)).toBe(
      GRID_STEP_MM * 2,
    );
    expect(roundUpToGridStep(GRID_STEP_MM)).toBe(GRID_STEP_MM);
  });
});

describe("roundUpToGridVertexStep", () => {
  it("rounds up to twice the grid step, so half a cell is still a whole grid step", () => {
    expect(roundUpToGridVertexStep(GRID_STEP_MM + JUST_PAST_MM)).toBe(
      GRID_VERTEX_STEP_MM,
    );
    expect(roundUpToGridVertexStep(GRID_VERTEX_STEP_MM + JUST_PAST_MM)).toBe(
      GRID_VERTEX_STEP_MM * 2,
    );
  });
});
