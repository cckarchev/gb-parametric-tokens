import { describe, expect, it } from "vitest";

import { signedArea } from "../svg/normalizeWinding";
import { computeRingContour } from "./ringContour";

const distanceFromOrigin = ([x, y]: [number, number]): number => Math.hypot(x, y);

describe("computeRingContour", () => {
  it("returns exactly an outer contour and an inner contour", () => {
    const contours = computeRingContour(10, 2);

    expect(contours.length).toBe(2);
  });

  it("places the outer contour at radiusMm + widthMm/2 and the inner at radiusMm - widthMm/2", () => {
    const [outer, inner] = computeRingContour(10, 2);

    for (const point of outer) {
      expect(distanceFromOrigin(point)).toBeCloseTo(11, 9);
    }

    for (const point of inner) {
      expect(distanceFromOrigin(point)).toBeCloseTo(9, 9);
    }
  });

  it("winds the outer contour counter-clockwise and the inner clockwise, so it fills as a hole", () => {
    const [outer, inner] = computeRingContour(10, 2);

    expect(signedArea(outer)).toBeGreaterThan(0);
    expect(signedArea(inner)).toBeLessThan(0);
  });
});
