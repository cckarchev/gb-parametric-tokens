import { describe, expect, it } from "vitest";

import { Vec2 } from "../types";
import { placeIcon, rotateContours, translateContours } from "./iconPlacement";

describe("placeIcon", () => {
  it("flips Y, centers on the origin, and scales to the target diameter", () => {
    // SVG-space square, y-down: (0,0) top-left, (10,10) bottom-right.
    const svgSquare: Vec2[][] = [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
    ];

    const [placed] = placeIcon(svgSquare, { targetDiameterMm: 20, scale: 1 });

    expect(placed).toEqual([
      [-10, 10],
      [10, 10],
      [10, -10],
      [-10, -10],
    ]);
  });

  it("applies the scale factor on top of the fit-to-target size", () => {
    const svgSquare: Vec2[][] = [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
    ];

    const [placed] = placeIcon(svgSquare, { targetDiameterMm: 20, scale: 0.5 });

    expect(placed).toEqual([
      [-5, 5],
      [5, 5],
      [5, -5],
      [-5, -5],
    ]);
  });
});

describe("rotateContours", () => {
  it("leaves points unchanged at a rotation of 0 degrees", () => {
    const point: Vec2[][] = [[[3, 4]]];

    expect(rotateContours(point, 0)).toEqual([[[3, 4]]]);
  });

  it("rotates a point 90 degrees counterclockwise about the origin", () => {
    const point: Vec2[][] = [[[1, 0]]];
    const [[[x, y]]] = rotateContours(point, 90);

    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(1);
  });

  it("rotates a point -90 degrees (clockwise) about the origin", () => {
    const point: Vec2[][] = [[[0, 1]]];
    const [[[x, y]]] = rotateContours(point, -90);

    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(0);
  });
});

describe("translateContours", () => {
  it("translateContours shifts every point by a fixed offset", () => {
    const square: Vec2[][] = [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
    ];

    expect(translateContours(square, [10, -5])).toEqual([
      [
        [10, -5],
        [11, -5],
        [11, -4],
        [10, -4],
      ],
    ]);
  });
});
