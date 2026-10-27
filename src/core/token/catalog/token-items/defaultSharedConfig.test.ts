import { describe, expect, it } from "vitest";

import {
  DEFAULT_BODY_FONT_ID,
  DEFAULT_DISPLAY_FONT_ID,
} from "../../text/fontCatalog";
import {
  DEFAULT_SHARED_CONFIG,
  DEFAULT_TOKEN_TUNING,
} from "./defaultSharedConfig";

describe("DEFAULT_TOKEN_TUNING", () => {
  it("keeps today's crest and icon scales", () => {
    expect(DEFAULT_TOKEN_TUNING).toMatchObject({
      discToken: { crestScale: 0.85 },
      characterToken: { crestScale: 0.85 },
      ringBadge: { crestScale: 0.65 },
      condition: { iconScale: 0.72 },
      aoe: { compactDisc: { crestScale: 0.55 } },
    });
  });

  it("keeps today's text sizes", () => {
    expect(DEFAULT_TOKEN_TUNING).toMatchObject({
      ringBadge: { textSizeMm: 2.2 },
      momentum: { textSizeMm: 6 },
      aoe: {
        ring: { textSizeMm: 3.5 },
        compactDisc: { textSizeMm: 2.6 },
        crowfoot: { textSizeMm: 4 },
      },
    });
  });

  it("sets every token's text in the body font except Momentum's MP", () => {
    expect(DEFAULT_TOKEN_TUNING.characterToken.fontId).toBe(
      DEFAULT_BODY_FONT_ID,
    );
    expect(DEFAULT_TOKEN_TUNING.ringBadge.fontId).toBe(DEFAULT_BODY_FONT_ID);
    expect(DEFAULT_TOKEN_TUNING.aoe.fontId).toBe(DEFAULT_BODY_FONT_ID);
    expect(DEFAULT_TOKEN_TUNING.momentum.fontId).toBe(DEFAULT_DISPLAY_FONT_ID);
  });

  it("keeps the crow's foot geometry, fillet on, sized to print on a 0.4mm nozzle", () => {
    expect(DEFAULT_TOKEN_TUNING.aoe).toMatchObject({ bandWidthMm: 6 });
    expect(DEFAULT_TOKEN_TUNING.aoe.crowfoot).toEqual({
      spokeCount: 3,
      spokeWidthMm: 5,
      arcSweepDeg: 40,
      cornerRadiusMm: 1.5,
      filletEnabled: true,
      filletRadiusMm: 3,
      textSizeMm: 4,
      spokeTextCenterClearanceMm: 4,
      spokeTextBandMarginMm: 1,
    });
  });
});

describe("DEFAULT_SHARED_CONFIG", () => {
  it("carries the tuning defaults next to the existing fields", () => {
    expect(DEFAULT_SHARED_CONFIG.aoe).toEqual(DEFAULT_TOKEN_TUNING.aoe);
    expect(DEFAULT_SHARED_CONFIG).toMatchObject({
      nameSizeMm: 3,
      effectSizeMm: 1.9,
    });
    expect(DEFAULT_SHARED_CONFIG.goalInfluenceShape).toEqual({
      type: "disc",
      diameterMm: 20,
    });
    expect(DEFAULT_SHARED_CONFIG.aoeTemplateVariant).toBe("ring");
  });
});

describe("DEFAULT_SHARED_CONFIG.fitPolicy", () => {
  it("shrinks text that doesn't fit instead of squeezing its letters together", () => {
    expect(DEFAULT_SHARED_CONFIG.fitPolicy.minTracking).toBe(0);
    expect(DEFAULT_SHARED_CONFIG.fitPolicy.maxTracking).toBe(0);
  });
});
