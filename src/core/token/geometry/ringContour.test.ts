import { describe, expect, it } from "vitest";

import { signedArea } from "../svg/normalizeWinding";
import { computeRingContour } from "./ringContour";

const distanceFromOrigin = ([x, y]: [number, number]): number =>
  Math.hypot(x, y);

const PRECISION_DIGITS = 9;

describe("computeRingContour", () => {
  it("returns exactly an outer contour and an inner contour", () => {
    const contours = computeRingContour(10, 2);

    expect(contours.length).toBe(2);
  });

  it("places the outer contour at radiusMm + widthMm/2 and the inner at radiusMm - widthMm/2", () => {
    const radiusMm = 10;
    const widthMm = 2;
    const [outer, inner] = computeRingContour(radiusMm, widthMm);

    for (const point of outer) {
      expect(distanceFromOrigin(point)).toBeCloseTo(
        radiusMm + widthMm / 2,
        PRECISION_DIGITS,
      );
    }

    for (const point of inner) {
      expect(distanceFromOrigin(point)).toBeCloseTo(
        radiusMm - widthMm / 2,
        PRECISION_DIGITS,
      );
    }
  });

  it("winds the outer contour counter-clockwise and the inner clockwise, so it fills as a hole", () => {
    const [outer, inner] = computeRingContour(10, 2);

    expect(signedArea(outer)).toBeGreaterThan(0);
    expect(signedArea(inner)).toBeLessThan(0);
  });
});
