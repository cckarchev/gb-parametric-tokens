import path from "path";
import { describe, expect, it, vi } from "vitest";

import { findFontEntry, fontFilePath } from "./fontCatalog";
import { measureFontMetrics } from "./fontMetrics";
import { loadFontFile, loadTestFont } from "./testFont";

const loadCatalogFontFile = (fontId: string) => {
  const entry = findFontEntry(fontId);

  return loadFontFile(path.join(process.cwd(), "public", fontFilePath(entry.file)));
};

const METRIC_PRECISION_DIGITS = 3;

describe("measureFontMetrics", () => {
  it("reads a capital's height and an l's width off the font, as fractions of its size", () => {
    const metrics = measureFontMetrics(loadTestFont());

    // Saira Condensed Bold: "H" tops out at 688 and "l" is 129 wide, on a 1000-unit em.
    expect(metrics.ascentRatio).toBeCloseTo(0.688, METRIC_PRECISION_DIGITS);
    expect(metrics.stemWidthRatio).toBeCloseTo(0.129, METRIC_PRECISION_DIGITS);
  });

  it("measures the l's stroke at mid-height, not the tail or serifs that widen its outline", () => {
    const font = loadCatalogFontFile("fira-sans-condensed-bold");
    const stemBounds = font.charToGlyph("l").getBoundingBox();
    const outlineWidthRatio = (stemBounds.x2 - stemBounds.x1) / font.unitsPerEm;

    const metrics = measureFontMetrics(font);

    // Fira's l curls into a tail at the foot, so its outline is far wider than its stroke.
    expect(metrics.stemWidthRatio).toBeLessThan(outlineWidthRatio * 0.75);
    expect(metrics.stemWidthRatio).toBeGreaterThan(0.1);
  });

  it("measures each font only once, since every fitted line asks again", () => {
    const font = loadCatalogFontFile("lilita-one");
    const first = measureFontMetrics(font);
    const charToGlyph = vi.spyOn(font, "charToGlyph");

    const second = measureFontMetrics(font);

    expect(second).toEqual(first);
    expect(charToGlyph).not.toHaveBeenCalled();
  });
});
