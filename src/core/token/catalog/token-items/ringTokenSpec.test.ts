import { describe, expect, it } from "vitest";

import { DEFAULT_DISPLAY_FONT_ID } from "../../text/fontCatalog";
import { DEFAULT_SHARED_CONFIG } from "./defaultSharedConfig";
import { computeRingTextRadii } from "./ringTextRadii";
import { buildRingTokenSpec } from "./ringTokenSpec";
import { SharedConfig } from "./tokenItem";

describe("buildRingTokenSpec", () => {
  it("reads its text size, inset and crest from the ring badge settings", () => {
    const config: SharedConfig = {
      ...DEFAULT_SHARED_CONFIG,
      ringBadge: {
        textSizeMm: 3,
        textInsetMm: 2,
        crestScale: 0.5,
        fontId: DEFAULT_DISPLAY_FONT_ID,
      },
    };
    const spec = buildRingTokenSpec("Goal", "Influence", "Brewers", 1.5, config);
    const radii = computeRingTextRadii(
      config.goalInfluenceShape.diameterMm,
      2,
      3,
      DEFAULT_DISPLAY_FONT_ID,
    );

    expect(spec.lines.map((line) => line.sizeMm)).toEqual([3, 3]);
    expect(spec.lines.map((line) => line.radiusMm)).toEqual([radii.topMm, radii.bottomMm]);
    expect(spec.icons[0].scale).toBeCloseTo(0.5 * 1.5);
    expect(spec.fontId).toBe(DEFAULT_DISPLAY_FONT_ID);
  });
});
