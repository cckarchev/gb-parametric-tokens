import { describe, expect, it } from "vitest";

import type { Vec2 } from "../types";
import { placeIcon } from "./iconPlacement";

const SOLID_SQUARE: Vec2[][] = [
  [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ],
];

const TARGET_DIAMETER_MM = 20;
const TARGET_RADIUS_MM = TARGET_DIAMETER_MM / 2;

describe("placeIcon", () => {
  it("flips Y, centers on the origin, and scales to the target diameter (box fit, constrainToCircle off)", () => {
    // SVG-space square, y-down: (0,0) top-left, (10,10) bottom-right.
    const { contours, overflowsCircle } = placeIcon(SOLID_SQUARE, {
      targetDiameterMm: 20,
      scale: 1,
      constrainToCircle: false,
    });

    expect(contours).toEqual([
      [
        [-10, 10],
        [10, 10],
        [10, -10],
        [-10, -10],
      ],
    ]);
    // Still detected and reported even though the option didn't act on it: see
    // computeReliefComponentsShared.ts, where this drives the "needs attention"
    // flag regardless of whether shrinking is turned on.
    expect(overflowsCircle).toBe(true);
  });

  it("applies the scale factor on top of the fit-to-target size", () => {
    const scale = 0.5;
    const { contours } = placeIcon(SOLID_SQUARE, {
      targetDiameterMm: TARGET_DIAMETER_MM,
      scale,
      constrainToCircle: false,
    });
    const half = TARGET_RADIUS_MM * scale;

    expect(contours).toEqual([
      [
        [-half, half],
        [half, half],
        [half, -half],
        [-half, -half],
      ],
    ]);
  });
});

describe("placeIcon constrained to its circle", () => {
  it("shrinks further than the box fit when constrainToCircle is on and the icon's own corners would poke past the target circle", () => {
    const { contours, overflowsCircle } = placeIcon(SOLID_SQUARE, {
      targetDiameterMm: 20,
      scale: 1,
      constrainToCircle: true,
    });
    const [placed] = contours;
    // Each corner lands on the target circle, so the half side is its radius
    // over √2.
    const half = TARGET_RADIUS_MM / Math.SQRT2;

    expect(overflowsCircle).toBe(true);
    placed.forEach(([x, y], index) => {
      const [expectedX, expectedY] = [
        [-half, half],
        [half, half],
        [half, -half],
        [-half, -half],
      ][index];

      expect(x).toBeCloseTo(expectedX);
      expect(y).toBeCloseTo(expectedY);
    });
  });

  it("never lets a placed point sit further from the origin than the target circle's radius when constrainToCircle is on", () => {
    const { contours, overflowsCircle } = placeIcon(SOLID_SQUARE, {
      targetDiameterMm: 20,
      scale: 1,
      constrainToCircle: true,
    });
    const maxRadius = Math.max(
      ...contours.flat().map(([x, y]) => Math.hypot(x, y)),
    );

    expect(overflowsCircle).toBe(true);
    expect(maxRadius).toBeCloseTo(10);
  });

  it("checks overflow against the real target circle, not one shrunk by the icon's own scale", () => {
    // At scale 0.5 the square sits well inside the full circle. Checked against
    // targetDiameterMm * scale instead, it would still be flagged.
    const { overflowsCircle } = placeIcon(SOLID_SQUARE, {
      targetDiameterMm: 20,
      scale: 0.5,
      constrainToCircle: true,
    });

    expect(overflowsCircle).toBe(false);
  });
});

describe("placeIcon overflow", () => {
  it("does not flag overflow when the icon's own farthest point already sits on the target circle", () => {
    // A diamond whose vertices sit exactly on its bounding box's inscribed
    // circle: the box fit and the circle fit agree, so nothing should shrink
    // further than before.
    const vertexMm = 5;
    const diamond: Vec2[][] = [
      [
        [vertexMm, 0],
        [0, vertexMm],
        [-vertexMm, 0],
        [0, -vertexMm],
      ],
    ];

    const { overflowsCircle } = placeIcon(diamond, {
      targetDiameterMm: 20,
      scale: 1,
      constrainToCircle: true,
    });

    expect(overflowsCircle).toBe(false);
  });
});
