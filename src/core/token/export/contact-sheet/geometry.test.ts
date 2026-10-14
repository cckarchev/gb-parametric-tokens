import { describe, expect, it } from "vitest";

import { CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG } from "../../preview/svgBaseReference";
import { GRID_STEP_MM } from "../../preview/svgGrid";
import {
  allContoursOf,
  computeOverflowMarginMm,
  roundUpToGridStep,
  roundUpToGridVertexStep,
  shiftForArcAnchor,
  unionBounds,
} from "./geometry";
import { FlippedContactSheetItem } from "./types";

const GRID_VERTEX_STEP_MM = GRID_STEP_MM * 2;

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
    expect(shiftForArcAnchor([[[0, 0]]])).toEqual([[[CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG]]]);
  });
});

describe("unionBounds", () => {
  it("covers both boxes", () => {
    const union = unionBounds({ min: [0, 5], max: [10, 6] }, { min: [-2, 0], max: [3, 8] });

    expect(union).toEqual({ min: [-2, 0], max: [10, 8] });
  });
});

describe("computeOverflowMarginMm", () => {
  it("is zero with no arc items", () => {
    expect(computeOverflowMarginMm([], 0)).toBe(0);
  });

  it("is zero when nothing reaches past the origin", () => {
    expect(computeOverflowMarginMm([{ min: [2, 3], max: [9, 9] }], 0)).toBe(0);
  });

  it("covers the item reaching furthest past the origin on the given axis", () => {
    const boundsList = [
      { min: [-3, -1] as [number, number], max: [9, 9] as [number, number] },
      { min: [-1, -6] as [number, number], max: [9, 9] as [number, number] },
    ];

    expect(computeOverflowMarginMm(boundsList, 0)).toBe(3);
    expect(computeOverflowMarginMm(boundsList, 1)).toBe(6);
  });
});

describe("roundUpToGridStep", () => {
  it("rounds up to the next grid line and keeps a value already on one", () => {
    expect(roundUpToGridStep(GRID_STEP_MM + 0.1)).toBe(GRID_STEP_MM * 2);
    expect(roundUpToGridStep(GRID_STEP_MM)).toBe(GRID_STEP_MM);
  });
});

describe("roundUpToGridVertexStep", () => {
  it("rounds up to twice the grid step, so half a cell is still a whole grid step", () => {
    expect(roundUpToGridVertexStep(GRID_STEP_MM + 0.1)).toBe(GRID_VERTEX_STEP_MM);
    expect(roundUpToGridVertexStep(GRID_VERTEX_STEP_MM + 0.1)).toBe(GRID_VERTEX_STEP_MM * 2);
  });
});
