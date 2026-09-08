import { readFileSync } from "fs";
import opentype from "opentype.js";
import path from "path";
import { describe, expect, it } from "vitest";

import { measureAdvances } from "./measureAdvances";

const loadTestFont = () => {
  const buffer = readFileSync(path.join(process.cwd(), "public/fonts/SairaCondensed-Bold.ttf"));
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  return opentype.parse(arrayBuffer);
};

describe("measureAdvances", () => {
  it("returns one advance per character and one kerning per adjacent pair", () => {
    const font = loadTestFont();

    const { advancesMm, kerningsMm } = measureAdvances(font, "abc", 10);

    expect(advancesMm.length).toBe(3);
    expect(kerningsMm.length).toBe(2);
    expect(advancesMm.every((advance) => advance > 0)).toBe(true);
  });

  it("scales advances by sizeMm / unitsPerEm", () => {
    const font = loadTestFont();

    const small = measureAdvances(font, "a", 5);
    const big = measureAdvances(font, "a", 10);

    expect(big.advancesMm[0] / small.advancesMm[0]).toBeCloseTo(2, 5);
  });
});
