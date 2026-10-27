import { describe, expect, it } from "vitest";

import { measureAdvances } from "./measureAdvances";
import { loadTestFont } from "./testFont";

describe("measureAdvances", () => {
  it("returns one advance per character and one kerning per adjacent pair", () => {
    const font = loadTestFont();

    const text = "abc";
    const { advancesMm, kerningsMm } = measureAdvances(font, text, 10);

    expect(advancesMm.length).toBe(text.length);
    expect(kerningsMm.length).toBe(text.length - 1);
    expect(advancesMm.every((advance) => advance > 0)).toBe(true);
  });

  it("scales advances by sizeMm / unitsPerEm", () => {
    const font = loadTestFont();

    const smallSizeMm = 5;
    const scaleFactor = 2;
    const precisionDigits = 5;
    const small = measureAdvances(font, "a", smallSizeMm);
    const big = measureAdvances(font, "a", smallSizeMm * scaleFactor);

    expect(big.advancesMm[0] / small.advancesMm[0]).toBeCloseTo(
      scaleFactor,
      precisionDigits,
    );
  });
});
