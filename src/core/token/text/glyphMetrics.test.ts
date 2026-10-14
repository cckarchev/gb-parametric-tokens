import { describe, expect, it } from "vitest";

import { DEFAULT_BODY_FONT_ID, DEFAULT_DISPLAY_FONT_ID, findFontEntry } from "./fontCatalog";
import { estimateAscentMm } from "./glyphMetrics";

describe("estimateAscentMm", () => {
  it("scales the chosen font's capital height by the text size", () => {
    const sizeMm = 4;
    const displayAscentRatio = findFontEntry(DEFAULT_DISPLAY_FONT_ID).metrics.ascentRatio;

    expect(estimateAscentMm(sizeMm, DEFAULT_DISPLAY_FONT_ID)).toBeCloseTo(
      sizeMm * displayAscentRatio,
    );
  });

  it("uses the body font when no font is named", () => {
    const sizeMm = 4;

    expect(estimateAscentMm(sizeMm, undefined)).toBe(
      estimateAscentMm(sizeMm, DEFAULT_BODY_FONT_ID),
    );
  });
});
