import { describe, expect, it } from "vitest";

import type { Vec2 } from "../types";
import {
  flipContoursY,
  rotateContours,
  translateContours,
} from "./contourTransforms";

// Points off both axes, so a swapped or dropped coordinate shows.
const P = { x: 3, y: 4 };
const Q = { x: -5, y: 6 };
const QUARTER_TURN_DEG = 90;

describe("flipContoursY", () => {
  it("negates every y and leaves every x alone", () => {
    const contours: Vec2[][] = [
      [
        [1, 2],
        [P.x, -P.y],
      ],
    ];

    expect(flipContoursY(contours)).toEqual([
      [
        [1, -2],
        [P.x, P.y],
      ],
    ]);
  });

  it("is its own inverse", () => {
    const contours: Vec2[][] = [
      [
        [1, 2],
        [P.x, -P.y],
        [Q.x, Q.y],
      ],
    ];

    expect(flipContoursY(flipContoursY(contours))).toEqual(contours);
  });

  it("flips every contour, not just the first", () => {
    const contours: Vec2[][] = [[[0, 1]], [[0, 2]]];

    expect(flipContoursY(contours)).toEqual([[[0, -1]], [[0, -2]]]);
  });
});

describe("rotateContours", () => {
  const point: Vec2[][] = [[[P.x, P.y]]];

  it("leaves a point untouched at zero degrees", () => {
    expect(rotateContours(point, 0)).toEqual([[[P.x, P.y]]]);
  });

  it("turns counter-clockwise for a positive angle", () => {
    const [[[x, y]]] = rotateContours(point, QUARTER_TURN_DEG);

    expect(x).toBeCloseTo(-P.y);
    expect(y).toBeCloseTo(P.x);
  });

  it("turns clockwise for a negative angle", () => {
    const [[[x, y]]] = rotateContours(point, -QUARTER_TURN_DEG);

    expect(x).toBeCloseTo(P.y);
    expect(y).toBeCloseTo(-P.x);
  });
});

describe("translateContours", () => {
  it("shifts every point by a fixed offset", () => {
    const sideMm = 2;
    const offset = { x: 10, y: -5 };
    const square: Vec2[][] = [
      [
        [0, 0],
        [sideMm, 0],
        [sideMm, sideMm],
        [0, sideMm],
      ],
    ];

    expect(translateContours(square, [offset.x, offset.y])).toEqual([
      [
        [offset.x, offset.y],
        [offset.x + sideMm, offset.y],
        [offset.x + sideMm, offset.y + sideMm],
        [offset.x, offset.y + sideMm],
      ],
    ]);
  });
});
