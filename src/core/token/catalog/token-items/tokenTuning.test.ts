import { describe, expect, it } from "vitest";

import type { CatalogEffect } from "../catalogTypes";
import { buildCharacterTokenSpec } from "./characterTokenSpec";
import { buildConditionTokenSpec } from "./conditionTokenSpec";
import { DEFAULT_SHARED_CONFIG } from "./defaultSharedConfig";
import { buildGenericTokenSpec } from "./genericTokenSpec";
import { buildInfluenceTokenSpec } from "./influenceTokenSpec";
import { buildMomentumTokenSpec } from "./momentumTokenSpec";
import type { SharedConfig } from "./tokenItem";

const GUILD_ICON_ID = "Brewers";
const GUILD_ICON_SCALE = 1.5;

const effect: CatalogEffect = {
  id: "command",
  name: "Command",
  effect: "-2/-2 MOV",
};

describe("token builders read their tuning group", () => {
  it("scales generic and Influence crests by the disc token setting", () => {
    const config: SharedConfig = {
      ...DEFAULT_SHARED_CONFIG,
      influenceIconId: GUILD_ICON_ID,
      discToken: { crestScale: 0.5 },
    };
    const generic = buildGenericTokenSpec(
      { name: "Gutted" },
      GUILD_ICON_ID,
      GUILD_ICON_SCALE,
      config,
    );
    const influence = buildInfluenceTokenSpec(
      GUILD_ICON_ID,
      GUILD_ICON_SCALE,
      config,
    );

    expect(generic.icons[0].scale).toBeCloseTo(0.5 * GUILD_ICON_SCALE);
    expect(influence.icons[0].scale).toBeCloseTo(0.5 * GUILD_ICON_SCALE);
  });

  it("scales a character token's crests and balances its lines by the character settings", () => {
    const config: SharedConfig = {
      ...DEFAULT_SHARED_CONFIG,
      balanceTwoLineSizes: true,
      characterToken: {
        ...DEFAULT_SHARED_CONFIG.characterToken,
        crestScale: 0.6,
        balanceNameScale: 0.5,
        balanceEffectScale: 2,
      },
    };
    const spec = buildCharacterTokenSpec(
      effect,
      GUILD_ICON_ID,
      GUILD_ICON_SCALE,
      config,
    );

    expect(spec.icons.map((icon) => icon.scale)).toEqual([
      0.6 * GUILD_ICON_SCALE,
      0.6 * GUILD_ICON_SCALE,
    ]);
    expect(spec.lines[0].sizeMm).toBeCloseTo(config.nameSizeMm * 0.5);
    expect(spec.lines[1].sizeMm).toBeCloseTo(config.effectSizeMm * 2);
  });

  it("scales a condition's icon by the condition setting", () => {
    const config: SharedConfig = {
      ...DEFAULT_SHARED_CONFIG,
      condition: { iconScale: 0.5 },
    };
    const spec = buildConditionTokenSpec(
      { id: "knockedDown", name: "Knocked Down", iconId: "knock-down" },
      config,
    );

    expect(spec.icons[0].scale).toBeCloseTo(0.5);
  });

  it("sizes Momentum's text and ring by the Momentum settings, the ring inset from the rim", () => {
    const config: SharedConfig = {
      ...DEFAULT_SHARED_CONFIG,
      momentum: {
        ...DEFAULT_SHARED_CONFIG.momentum,
        textSizeMm: 4,
        ringInsetMm: 1,
        ringWidthMm: 1,
      },
    };
    const spec = buildMomentumTokenSpec(config);
    const discRadiusMm = config.discShape.diameterMm / 2;

    expect(spec.lines[0].sizeMm).toBe(4);
    expect(spec.decorations[0].widthMm).toBe(1);
    expect(spec.decorations[0].radiusMm).toBeCloseTo(discRadiusMm - 1 - 0.5);
  });
});
