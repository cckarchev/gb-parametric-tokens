import { describe, expect, it } from "vitest";

import { DEFAULT_DISPLAY_FONT_ID } from "../../text/fontCatalog";
import { DEFAULT_SHARED_CONFIG } from "./defaultSharedConfig";
import { computeRingTextRadii } from "./ringTextRadii";
import { buildRingTokenSpec } from "./ringTokenSpec";
import type { SharedConfig } from "./tokenItem";

describe("buildRingTokenSpec", () => {
  it("reads its text size, inset and crest from the ring badge settings", () => {
    const ringBadge = {
      textSizeMm: 3,
      textInsetMm: 2,
      crestScale: 0.5,
      fontId: DEFAULT_DISPLAY_FONT_ID,
    };
    const guildIconScale = 1.5;
    const config: SharedConfig = { ...DEFAULT_SHARED_CONFIG, ringBadge };
    const spec = buildRingTokenSpec(
      "Goal",
      "Influence",
      "Brewers",
      guildIconScale,
      config,
    );
    const radii = computeRingTextRadii(
      config.goalInfluenceShape.diameterMm,
      ringBadge.textInsetMm,
      ringBadge.textSizeMm,
      DEFAULT_DISPLAY_FONT_ID,
    );

    expect(spec.lines.map((line) => line.sizeMm)).toEqual([
      ringBadge.textSizeMm,
      ringBadge.textSizeMm,
    ]);
    expect(spec.lines.map((line) => line.radiusMm)).toEqual([
      radii.topMm,
      radii.bottomMm,
    ]);
    expect(spec.icons[0].scale).toBeCloseTo(
      ringBadge.crestScale * guildIconScale,
    );
    expect(spec.fontId).toBe(DEFAULT_DISPLAY_FONT_ID);
  });
});
