import { describe, expect, it } from "vitest";

import { Vec2 } from "../types";
import { flipContoursY, rotateContours, translateContours } from "./contourTransforms";

describe("flipContoursY", () => {
  it("negates every y and leaves every x alone", () => {
    const contours: Vec2[][] = [
      [
        [1, 2],
        [3, -4],
      ],
    ];

    expect(flipContoursY(contours)).toEqual([
      [
        [1, -2],
        [3, 4],
      ],
    ]);
  });

  it("is its own inverse", () => {
    const contours: Vec2[][] = [
      [
        [1, 2],
        [3, -4],
        [-5, 6],
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
  const point: Vec2[][] = [[[3, 4]]];

  it("leaves a point untouched at zero degrees", () => {
    expect(rotateContours(point, 0)).toEqual([[[3, 4]]]);
  });

  it("turns counter-clockwise for a positive angle", () => {
    const [[[x, y]]] = rotateContours(point, 90);

    expect(x).toBeCloseTo(-4);
    expect(y).toBeCloseTo(3);
  });

  it("turns clockwise for a negative angle", () => {
    const [[[x, y]]] = rotateContours(point, -90);

    expect(x).toBeCloseTo(4);
    expect(y).toBeCloseTo(-3);
  });
});

describe("translateContours", () => {
  it("shifts every point by a fixed offset", () => {
    const square: Vec2[][] = [
      [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
      ],
    ];

    expect(translateContours(square, [10, -5])).toEqual([
      [
        [10, -5],
        [12, -5],
        [12, -3],
        [10, -3],
      ],
    ]);
  });
});
