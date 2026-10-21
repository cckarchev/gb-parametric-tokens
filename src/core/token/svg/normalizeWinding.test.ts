import { describe, expect, it } from "vitest";

import type { Vec2 } from "../types";
import { normalizeWinding, signedArea } from "./normalizeWinding";

// An axis-aligned square from (min, min) to (max, max), wound counter-clockwise.
const ccwSquareBetween = (min: number, max: number): Vec2[] => [
  [min, min],
  [max, min],
  [max, max],
  [min, max],
];

const ccwSquare: Vec2[] = ccwSquareBetween(0, 10);

const cwSquare: Vec2[] = [...ccwSquare].reverse();

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
    const outerSideMm = 20;
    const holeMarginMm = 5;
    const outer = ccwSquareBetween(0, outerSideMm);
    const holeGivenAsCcw = ccwSquareBetween(
      holeMarginMm,
      outerSideMm - holeMarginMm,
    );

    const [normalizedOuter, normalizedHole] = normalizeWinding([
      outer,
      holeGivenAsCcw,
    ]);

    expect(signedArea(normalizedOuter)).toBeGreaterThan(0);
    expect(signedArea(normalizedHole)).toBeLessThan(0);
  });
});
