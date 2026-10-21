import { describe, expect, it } from "vitest";

import type { Vec2 } from "../types";
import { trimIconToCircle } from "./trimIconToCircle";

const CIRCLE_RADIUS_MM = 5;
// Float noise from the clipping math, far below anything printable.
const RADIUS_EPSILON_MM = 1e-6;

// An axis-aligned square from (min, min) to (max, max).
const squareBetween = (min: number, max: number): Vec2[][] => [
  [
    [min, min],
    [max, min],
    [max, max],
    [min, max],
  ],
];

const maxRadius = (contours: Vec2[][]): number =>
  Math.max(...contours.flat().map(([x, y]) => Math.hypot(x, y)));

const totalArea = (contours: Vec2[][]): number =>
  contours.reduce((sum, contour) => {
    let area = 0;

    for (let i = 0; i < contour.length; i++) {
      const [x0, y0] = contour[i];
      const [x1, y1] = contour[(i + 1) % contour.length];

      area += x0 * y1 - x1 * y0;
    }

    return sum + Math.abs(area) / 2;
  }, 0);

describe("trimIconToCircle", () => {
  it("leaves a shape that already sits within the circle untouched", async () => {
    const smallSquare: Vec2[][] = [
      [
        [-2, -2],
        [2, -2],
        [2, 2],
        [-2, 2],
      ],
    ];

    const trimmed = await trimIconToCircle(smallSquare, 10);

    expect(totalArea(trimmed)).toBeCloseTo(totalArea(smallSquare), 1);
  });

  it("cuts off the part of a shape that pokes past the circle's radius", async () => {
    // A square centered on the origin, corners at radius 5*sqrt(2) ~= 7.07mm, clipped to a
    // circle of radius 5mm: its corners must be cut, its area must shrink, but its untouched
    // sides (well within the circle) stay exactly where they were.
    const bigSquare = squareBetween(-CIRCLE_RADIUS_MM, CIRCLE_RADIUS_MM);

    const trimmed = await trimIconToCircle(bigSquare, CIRCLE_RADIUS_MM);

    expect(maxRadius(trimmed)).toBeLessThanOrEqual(
      CIRCLE_RADIUS_MM + RADIUS_EPSILON_MM,
    );
    expect(totalArea(trimmed)).toBeLessThan(totalArea(bigSquare));
    expect(totalArea(trimmed)).toBeGreaterThan(0);
  });

  it("returns no contours when the shape sits entirely outside the circle", async () => {
    const farCornerMm = 100;
    const farAwaySquare = squareBetween(farCornerMm, farCornerMm + 2);

    const trimmed = await trimIconToCircle(farAwaySquare, CIRCLE_RADIUS_MM);

    expect(trimmed).toEqual([]);
  });
});
