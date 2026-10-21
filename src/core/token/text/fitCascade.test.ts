import { describe, expect, it } from "vitest";

import { computeSingleLineFit } from "./fitCascade";

// Three 5mm glyphs with two gaps between them: 15mm of text before any tracking.
const GLYPH_ADVANCE_MM = 5;
const ADVANCES_MM = [GLYPH_ADVANCE_MM, GLYPH_ADVANCE_MM, GLYPH_ADVANCE_MM];
const TEXT_LENGTH_MM = GLYPH_ADVANCE_MM * ADVANCES_MM.length;
const GAP_COUNT = ADVANCES_MM.length - 1;
const PRECISION_DIGITS = 9;

const lineFit = (availableArcLengthMm: number) =>
  computeSingleLineFit({
    advancesMm: ADVANCES_MM,
    kerningsMm: [0, 0],
    availableArcLengthMm,
    minTrackingMm: 0,
    maxTrackingMm: 1,
    minScale: 0.5,
  });

describe("computeSingleLineFit", () => {
  it("fits as-is at maxTrackingMm when there's plenty of room", () => {
    const roomyArcLengthMm = 20;
    const result = lineFit(roomyArcLengthMm);

    expect(result).toEqual({ fits: true, trackingMm: 1, scaleFactor: 1 });
  });

  it("solves for the exact tracking that fits when max tracking overflows but min tracking fits", () => {
    const availableArcLengthMm = 16;
    const result = lineFit(availableArcLengthMm);

    expect(result.fits).toBe(true);
    if (result.fits) {
      expect(result.trackingMm).toBeCloseTo(
        (availableArcLengthMm - TEXT_LENGTH_MM) / GAP_COUNT,
        PRECISION_DIGITS,
      );
      expect(result.scaleFactor).toBe(1);
    }
  });

  it("falls back to scaling down, at minTrackingMm, when tracking alone cannot fit it", () => {
    const availableArcLengthMm = 10;
    const result = lineFit(availableArcLengthMm);

    expect(result.fits).toBe(true);
    if (result.fits) {
      expect(result.trackingMm).toBe(0);
      expect(result.scaleFactor).toBeCloseTo(
        availableArcLengthMm / TEXT_LENGTH_MM,
        PRECISION_DIGITS,
      );
    }
  });

  it("reports fits: false when even minScale is not enough", () => {
    const result = lineFit(GLYPH_ADVANCE_MM);

    expect(result).toEqual({ fits: false });
  });
});
