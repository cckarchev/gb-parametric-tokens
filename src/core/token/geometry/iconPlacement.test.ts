import { describe, expect, it } from "vitest";

import { Vec2 } from "../types";
import { placeIcon, rotateContours, translateContours } from "./iconPlacement";

const SOLID_SQUARE: Vec2[][] = [
  [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ],
];

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
    // Still detected and reported even though the option didn't act on it -- see
    // computeReliefComponentsShared.ts, where this drives the "needs attention" flag
    // regardless of whether shrinking is turned on.
    expect(overflowsCircle).toBe(true);
  });

  it("applies the scale factor on top of the fit-to-target size", () => {
    const { contours } = placeIcon(SOLID_SQUARE, {
      targetDiameterMm: 20,
      scale: 0.5,
      constrainToCircle: false,
    });

    expect(contours).toEqual([
      [
        [-5, 5],
        [5, 5],
        [5, -5],
        [-5, -5],
      ],
    ]);
  });

  it("shrinks further than the box fit when constrainToCircle is on and the icon's own corners would poke past the target circle", () => {
    const { contours, overflowsCircle } = placeIcon(SOLID_SQUARE, {
      targetDiameterMm: 20,
      scale: 1,
      constrainToCircle: true,
    });
    const [placed] = contours;
    const half = 5 * Math.sqrt(2);

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
    const maxRadius = Math.max(...contours.flat().map(([x, y]) => Math.hypot(x, y)));

    expect(overflowsCircle).toBe(true);
    expect(maxRadius).toBeCloseTo(10);
  });

  it("checks overflow against the real target circle, not one shrunk by the icon's own scale", () => {
    // Same solid square that overflows at scale 1 (see above) -- but at scale 0.5 its nominal
    // box-fit size is already small enough to sit well within the real, full-size target circle,
    // so there's nothing to flag or correct. The overflow check must reference targetDiameterMm
    // itself, not targetDiameterMm * scale, or this would still (wrongly) flag it.
    const { overflowsCircle } = placeIcon(SOLID_SQUARE, {
      targetDiameterMm: 20,
      scale: 0.5,
      constrainToCircle: true,
    });

    expect(overflowsCircle).toBe(false);
  });

  it("does not flag overflow when the icon's own farthest point already sits on the target circle", () => {
    // A diamond whose vertices sit exactly on its bounding box's inscribed circle: the box fit
    // and the circle fit agree, so nothing should shrink further than before.
    const diamond: Vec2[][] = [
      [
        [5, 0],
        [0, 5],
        [-5, 0],
        [0, -5],
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
