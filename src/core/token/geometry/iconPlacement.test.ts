import { describe, expect, it } from "vitest";

import { Vec2 } from "../types";
import { placeIcon, translateContours } from "./iconPlacement";

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
