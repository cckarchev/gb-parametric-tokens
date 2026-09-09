import { describe, expect, it } from "vitest";

import { Vec2 } from "../types";
import { growIconOutline } from "./growIconOutline";

const maxDistanceFromOrigin = (contours: Vec2[][]): number => {
  return Math.max(...contours.flat().map(([x, y]) => Math.hypot(x, y)));
};

const totalArea = (contours: Vec2[][]): number => {
  return contours.reduce((sum, contour) => {
    let area = 0;

    for (let i = 0; i < contour.length; i++) {
      const [x0, y0] = contour[i];
      const [x1, y1] = contour[(i + 1) % contour.length];

      area += x0 * y1 - x1 * y0;
    }

    return sum + Math.abs(area) / 2;
  }, 0);
};

describe("growIconOutline", () => {
  it("dilates a shape's footprint outward by the given margin", async () => {
    const square: Vec2[][] = [
      [
        [-2, -2],
        [2, -2],
        [2, 2],
        [-2, 2],
      ],
    ];

    const grown = await growIconOutline(square, 1);

    // A 4x4 square dilated by 1mm on every side becomes (roughly) a 6x6 rounded square --
    // area strictly bigger than the original, and every original corner still lies within
    // the grown footprint's own reach from the origin.
    expect(totalArea(grown)).toBeGreaterThan(totalArea(square));
    expect(maxDistanceFromOrigin(grown)).toBeGreaterThan(maxDistanceFromOrigin(square));
  });

  it("leaves the footprint unchanged for a zero margin", async () => {
    const square: Vec2[][] = [
      [
        [-2, -2],
        [2, -2],
        [2, 2],
        [-2, 2],
      ],
    ];

    const grown = await growIconOutline(square, 0);

    expect(totalArea(grown)).toBeCloseTo(totalArea(square), 1);
  });
});
