import { describe, expect, it } from "vitest";

import { DEFAULT_DISPLAY_FONT_ID } from "../../text/fontCatalog";
import { estimateAscentMm } from "../../text/glyphMetrics";
import { computeRingTextRadii } from "./ringTextRadii";

describe("computeRingTextRadii", () => {
  it("puts the bottom baseline the inset in from the rim, the top one an ascent further in", () => {
    const radii = computeRingTextRadii(20, 1, 2.2, DEFAULT_DISPLAY_FONT_ID);

    expect(radii.bottomMm).toBeCloseTo(9);
    expect(radii.topMm).toBeCloseTo(
      9 - estimateAscentMm(2.2, DEFAULT_DISPLAY_FONT_ID),
    );
  });

  it("keeps the text's distance from the rim when the disc grows", () => {
    const small = computeRingTextRadii(20, 1, 2.2, undefined);
    const large = computeRingTextRadii(30, 1, 2.2, undefined);

    expect(large.bottomMm - small.bottomMm).toBeCloseTo(5);
  });
});
