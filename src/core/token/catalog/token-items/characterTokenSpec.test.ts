import { describe, expect, it } from "vitest";

import { resolveEffect } from "../effects";
import { buildCharacterTokenSpec } from "./characterTokenSpec";
import { DEFAULT_SHARED_CONFIG } from "./defaultSharedConfig";
import { buildRingTokenSpec } from "./ringTokenSpec";
import { SharedConfig } from "./tokenItem";

const GUILD_ICON_ID = "Brewers";
const GUILD_ICON_SCALE = 1.5;
const CREST_SCALE = 0.8;
const NAME_SIZE_MM = 3;
const EFFECT_SIZE_MM = 2;
const BALANCE_NAME_SCALE = 0.5;
const BALANCE_EFFECT_SCALE = 2;

const config: SharedConfig = {
  ...DEFAULT_SHARED_CONFIG,
  nameSizeMm: NAME_SIZE_MM,
  effectSizeMm: EFFECT_SIZE_MM,
  showSecondLine: true,
  balanceTwoLineSizes: false,
  characterToken: {
    crestScale: CREST_SCALE,
    balanceNameScale: BALANCE_NAME_SCALE,
    balanceEffectScale: BALANCE_EFFECT_SCALE,
  },
};

const arcEffect = resolveEffect("commandingAura");
const ringEffect = resolveEffect("toppingOutInfluence");

describe("buildCharacterTokenSpec", () => {
  it("builds an arc with the name and effect lines and the crest on both sides", () => {
    const spec = buildCharacterTokenSpec(arcEffect, GUILD_ICON_ID, GUILD_ICON_SCALE, config);

    expect(spec.shape).toBe(config.arcShape);
    expect(spec.textLayout).toBe("arc");
    expect(spec.lines.map((line) => [line.text, line.sizeMm])).toEqual([
      [arcEffect.name, NAME_SIZE_MM],
      [arcEffect.effect, EFFECT_SIZE_MM],
    ]);
    expect(spec.icons.map((icon) => [icon.iconId, icon.side])).toEqual([
      [GUILD_ICON_ID, "left"],
      [GUILD_ICON_ID, "right"],
    ]);
    expect(spec.icons[0].scale).toBeCloseTo(CREST_SCALE * GUILD_ICON_SCALE);
  });

  it("prints only the name when the second line is off, even with balanced sizes on", () => {
    const nameOnlyConfig: SharedConfig = {
      ...config,
      showSecondLine: false,
      balanceTwoLineSizes: true,
    };
    const spec = buildCharacterTokenSpec(
      arcEffect,
      GUILD_ICON_ID,
      GUILD_ICON_SCALE,
      nameOnlyConfig,
    );

    expect(spec.lines.map((line) => [line.text, line.sizeMm])).toEqual([
      [arcEffect.name, NAME_SIZE_MM],
    ]);
  });

  it("shrinks the name and grows the effect when two-line sizes are balanced", () => {
    const balancedConfig: SharedConfig = { ...config, balanceTwoLineSizes: true };
    const spec = buildCharacterTokenSpec(
      arcEffect,
      GUILD_ICON_ID,
      GUILD_ICON_SCALE,
      balancedConfig,
    );

    expect(spec.lines[0].sizeMm).toBeCloseTo(NAME_SIZE_MM * BALANCE_NAME_SCALE);
    expect(spec.lines[1].sizeMm).toBeCloseTo(EFFECT_SIZE_MM * BALANCE_EFFECT_SCALE);
  });

  it("builds a ring layout effect as a ring token", () => {
    const spec = buildCharacterTokenSpec(ringEffect, GUILD_ICON_ID, GUILD_ICON_SCALE, config);
    const ringSpec = buildRingTokenSpec(
      ringEffect.name,
      ringEffect.effect,
      GUILD_ICON_ID,
      GUILD_ICON_SCALE,
      config,
    );

    expect(spec).toEqual(ringSpec);
  });
});
