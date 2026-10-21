import { describe, expect, it } from "vitest";

import type { Vec2 } from "../types";
import { normalizeWinding, signedArea } from "./normalizeWinding";

const ccwSquare: Vec2[] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];

const cwSquare: Vec2[] = [
  [0, 0],
  [0, 10],
  [10, 10],
  [10, 0],
];

describe("signedArea", () => {
  it("is positive for a counter-clockwise contour", () => {
    expect(signedArea([...ccwSquare])).toBeGreaterThan(0);
  });

  it("is negative for a clockwise contour", () => {
    expect(signedArea([...cwSquare])).toBeLessThan(0);
  });
});

describe("normalizeWinding", () => {
  it("leaves a single CCW outer contour untouched", () => {
    expect(normalizeWinding([[...ccwSquare]])).toEqual([[...ccwSquare]]);
  });

  it("reverses a single CW outer contour to CCW", () => {
    const [result] = normalizeWinding([[...cwSquare]]);

    expect(signedArea(result)).toBeGreaterThan(0);
  });

  it("forces a hole nested inside a CCW outer contour to be CW", () => {
    const outer: Vec2[] = [
      [0, 0],
      [20, 0],
      [20, 20],
      [0, 20],
    ];
    const holeGivenAsCcw: Vec2[] = [
      [5, 5],
      [15, 5],
      [15, 15],
      [5, 15],
    ];

    const [normalizedOuter, normalizedHole] = normalizeWinding([
      outer,
      holeGivenAsCcw,
    ]);

    expect(signedArea(normalizedOuter)).toBeGreaterThan(0);
    expect(signedArea(normalizedHole)).toBeLessThan(0);
  });
});
