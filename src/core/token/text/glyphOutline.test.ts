import { describe, expect, it } from "vitest";

import { getGlyphContours } from "./glyphOutline";
import { loadTestFont } from "./testFont";

const SIZE_MM = 10;
const TOLERANCE_MM = 0.05;
const SCALE_FACTOR = 2;
const PRECISION_DIGITS = 5;

describe("getGlyphContours", () => {
  it("produces one CCW contour for a hole-free glyph like 'l'", () => {
    const font = loadTestFont();
    const glyph = font.charToGlyph("l");

    const contours = getGlyphContours(glyph, SIZE_MM, TOLERANCE_MM);

    expect(contours.length).toBe(1);
  });

  it("produces two contours with opposite winding for a glyph with a counter, like 'o'", () => {
    const font = loadTestFont();
    const glyph = font.charToGlyph("o");

    const contours = getGlyphContours(glyph, SIZE_MM, TOLERANCE_MM);

    expect(contours.length).toBe(2);

    const signedAreas = contours.map((contour) => {
      let sum = 0;

      for (let i = 0; i < contour.length; i++) {
        const [x0, y0] = contour[i];
        const [x1, y1] = contour[(i + 1) % contour.length];

        sum += x0 * y1 - x1 * y0;
      }

      return sum;
    });

    expect(signedAreas[0] > 0).not.toBe(signedAreas[1] > 0);
  });

  it("scales glyph coordinates by sizeMm / unitsPerEm", () => {
    const font = loadTestFont();
    const glyph = font.charToGlyph("l");

    const smallContours = getGlyphContours(
      glyph,
      SIZE_MM / SCALE_FACTOR,
      TOLERANCE_MM,
    );
    const bigContours = getGlyphContours(glyph, SIZE_MM, TOLERANCE_MM);

    const smallWidth =
      Math.max(...smallContours[0].map(([x]) => x)) -
      Math.min(...smallContours[0].map(([x]) => x));
    const bigWidth =
      Math.max(...bigContours[0].map(([x]) => x)) -
      Math.min(...bigContours[0].map(([x]) => x));

    expect(bigWidth / smallWidth).toBeCloseTo(SCALE_FACTOR, PRECISION_DIGITS);
  });
});
