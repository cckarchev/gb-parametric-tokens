import { describe, expect, it } from "vitest";

import { DEFAULT_SHARED_CONFIG, DEFAULT_TOKEN_TUNING } from "./defaultSharedConfig";

describe("DEFAULT_TOKEN_TUNING", () => {
  it("keeps today's crest and icon scales", () => {
    expect(DEFAULT_TOKEN_TUNING.discToken.crestScale).toBe(0.85);
    expect(DEFAULT_TOKEN_TUNING.characterToken.crestScale).toBe(0.85);
    expect(DEFAULT_TOKEN_TUNING.ringBadge.crestScale).toBe(0.65);
    expect(DEFAULT_TOKEN_TUNING.condition.iconScale).toBe(0.72);
    expect(DEFAULT_TOKEN_TUNING.aoe.compactDisc.crestScale).toBe(0.55);
  });

  it("keeps today's text sizes", () => {
    expect(DEFAULT_TOKEN_TUNING.ringBadge.textSizeMm).toBe(2.2);
    expect(DEFAULT_TOKEN_TUNING.momentum.textSizeMm).toBe(6);
    expect(DEFAULT_TOKEN_TUNING.aoe.ring.textSizeMm).toBe(3.5);
    expect(DEFAULT_TOKEN_TUNING.aoe.compactDisc.textSizeMm).toBe(2.6);
    expect(DEFAULT_TOKEN_TUNING.aoe.crowfoot.textSizeMm).toBe(3);
  });

  it("keeps today's crow's foot geometry, fillet on", () => {
    expect(DEFAULT_TOKEN_TUNING.aoe.bandWidthMm).toBe(6);
    expect(DEFAULT_TOKEN_TUNING.aoe.crowfoot).toEqual({
      spokeCount: 3,
      spokeWidthMm: 5,
      arcSweepDeg: 30,
      cornerRadiusMm: 1.5,
      filletEnabled: true,
      filletRadiusMm: 3,
      textSizeMm: 3,
      spokeTextCenterClearanceMm: 4,
      spokeTextBandMarginMm: 1,
    });
  });
});

describe("DEFAULT_SHARED_CONFIG", () => {
  it("carries the tuning defaults next to the existing fields", () => {
    expect(DEFAULT_SHARED_CONFIG.aoe).toEqual(DEFAULT_TOKEN_TUNING.aoe);
    expect(DEFAULT_SHARED_CONFIG.nameSizeMm).toBe(3);
    expect(DEFAULT_SHARED_CONFIG.effectSizeMm).toBe(1.9);
    expect(DEFAULT_SHARED_CONFIG.goalInfluenceShape).toEqual({ type: "disc", diameterMm: 20 });
    expect(DEFAULT_SHARED_CONFIG.aoeTemplateVariant).toBe("ring");
  });
});
