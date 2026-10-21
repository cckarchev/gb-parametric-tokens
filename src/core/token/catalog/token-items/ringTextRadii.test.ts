import { describe, expect, it } from "vitest";

import { DEFAULT_DISPLAY_FONT_ID } from "../../text/fontCatalog";
import { estimateAscentMm } from "../../text/glyphMetrics";
import { computeRingTextRadii } from "./ringTextRadii";

const DIAMETER_MM = 20;
const INSET_MM = 1;
const TEXT_SIZE_MM = 2.2;

describe("computeRingTextRadii", () => {
  it("puts the bottom baseline the inset in from the rim, the top one an ascent further in", () => {
    const radii = computeRingTextRadii(
      DIAMETER_MM,
      INSET_MM,
      TEXT_SIZE_MM,
      DEFAULT_DISPLAY_FONT_ID,
    );
    const bottomBaselineMm = DIAMETER_MM / 2 - INSET_MM;

    expect(radii.bottomMm).toBeCloseTo(bottomBaselineMm);
    expect(radii.topMm).toBeCloseTo(
      bottomBaselineMm -
        estimateAscentMm(TEXT_SIZE_MM, DEFAULT_DISPLAY_FONT_ID),
    );
  });

  it("keeps the text's distance from the rim when the disc grows", () => {
    const largeDiameterMm = 30;
    const small = computeRingTextRadii(
      DIAMETER_MM,
      INSET_MM,
      TEXT_SIZE_MM,
      undefined,
    );
    const large = computeRingTextRadii(
      largeDiameterMm,
      INSET_MM,
      TEXT_SIZE_MM,
      undefined,
    );

    expect(large.bottomMm - small.bottomMm).toBeCloseTo(
      (largeDiameterMm - DIAMETER_MM) / 2,
    );
  });
});
