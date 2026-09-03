import { describe, expect, it } from "vitest";

import { computeSingleLineFit } from "./fitCascade";

describe("computeSingleLineFit", () => {
  it("fits as-is at maxTrackingMm when there's plenty of room", () => {
    const result = computeSingleLineFit({
      advancesMm: [5, 5, 5],
      kerningsMm: [0, 0],
      availableArcLengthMm: 20,
      minTrackingMm: 0,
      maxTrackingMm: 1,
      minScale: 0.5,
    });

    expect(result).toEqual({ fits: true, trackingMm: 1, scaleFactor: 1 });
  });

  it("solves for the exact tracking that fits when max tracking overflows but min tracking fits", () => {
    const result = computeSingleLineFit({
      advancesMm: [5, 5, 5],
      kerningsMm: [0, 0],
      availableArcLengthMm: 16,
      minTrackingMm: 0,
      maxTrackingMm: 1,
      minScale: 0.5,
    });

    expect(result.fits).toBe(true);
    if (result.fits) {
      expect(result.trackingMm).toBeCloseTo(0.5, 9);
      expect(result.scaleFactor).toBe(1);
    }
  });

  it("falls back to scaling down, at minTrackingMm, when tracking alone cannot fit it", () => {
    const result = computeSingleLineFit({
      advancesMm: [5, 5, 5],
      kerningsMm: [0, 0],
      availableArcLengthMm: 10,
      minTrackingMm: 0,
      maxTrackingMm: 1,
      minScale: 0.5,
    });

    expect(result.fits).toBe(true);
    if (result.fits) {
      expect(result.trackingMm).toBe(0);
      expect(result.scaleFactor).toBeCloseTo(10 / 15, 9);
    }
  });

  it("reports fits: false when even minScale is not enough", () => {
    const result = computeSingleLineFit({
      advancesMm: [5, 5, 5],
      kerningsMm: [0, 0],
      availableArcLengthMm: 5,
      minTrackingMm: 0,
      maxTrackingMm: 1,
      minScale: 0.5,
    });

    expect(result).toEqual({ fits: false });
  });
});
