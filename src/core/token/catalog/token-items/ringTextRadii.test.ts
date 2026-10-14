import { describe, expect, it } from "vitest";

import { estimateAscentMm } from "../../text/glyphMetrics";
import { computeRingTextRadii } from "./ringTextRadii";

describe("computeRingTextRadii", () => {
  it("puts the bottom baseline the inset in from the rim, the top one an ascent further in", () => {
    const radii = computeRingTextRadii(20, 1, 2.2);

    expect(radii.bottomMm).toBeCloseTo(9);
    expect(radii.topMm).toBeCloseTo(9 - estimateAscentMm(2.2));
  });

  it("keeps the text's distance from the rim when the disc grows", () => {
    const small = computeRingTextRadii(20, 1, 2.2);
    const large = computeRingTextRadii(30, 1, 2.2);

    expect(large.bottomMm - small.bottomMm).toBeCloseTo(5);
  });
});
