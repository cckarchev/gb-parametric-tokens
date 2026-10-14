import { describe, expect, it } from "vitest";

import { DEFAULT_BODY_FONT_ID, DEFAULT_DISPLAY_FONT_ID } from "../../text/fontCatalog";
import { resolveEffect } from "../effects";
import { buildCharacterTokenSpec } from "./characterTokenSpec";
import { DEFAULT_SHARED_CONFIG } from "./defaultSharedConfig";
import { buildRingTokenSpec } from "./ringTokenSpec";
import { SharedConfig } from "./tokenItem";

const GUILD_ICON_ID = "Brewers";
const GUILD_ICON_SCALE = 1.5;
const CREST_SCALE = 0.8;
const NAME_SIZE_MM = 3;
const SINGLE_LINE_NAME_SIZE_MM = 4;
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
    singleLineNameSizeMm: SINGLE_LINE_NAME_SIZE_MM,
    fontId: DEFAULT_BODY_FONT_ID,
  },
};

const arcEffect = resolveEffect("commandingAura");
const ringEffect = resolveEffect("toppingOutInfluence");
// Goad has no effect text, so it prints a single line even with the second line on.
const nameOnlyEffect = resolveEffect("goad");

describe("buildCharacterTokenSpec", () => {
  it("sets an arc token's text in the arc tokens' font", () => {
    const displayConfig: SharedConfig = {
      ...config,
      characterToken: { ...config.characterToken, fontId: DEFAULT_DISPLAY_FONT_ID },
    };

    const spec = buildCharacterTokenSpec(arcEffect, GUILD_ICON_ID, GUILD_ICON_SCALE, displayConfig);

    expect(spec.fontId).toBe(DEFAULT_DISPLAY_FONT_ID);
  });

  it("sets a ring-layout effect in the ring badges' font, like the rest of its sizing", () => {
    const displayConfig: SharedConfig = {
      ...config,
      ringBadge: { ...config.ringBadge, fontId: DEFAULT_DISPLAY_FONT_ID },
    };

    const spec = buildCharacterTokenSpec(
      ringEffect,
      GUILD_ICON_ID,
      GUILD_ICON_SCALE,
      displayConfig,
    );

    expect(spec.fontId).toBe(DEFAULT_DISPLAY_FONT_ID);
  });

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

  it("prints only the name, at the single-line size, when the second line is off", () => {
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
      [arcEffect.name, SINGLE_LINE_NAME_SIZE_MM],
    ]);
  });

  it("falls back to the regular name size when the single-line name doesn't fit", () => {
    const spec = buildCharacterTokenSpec(nameOnlyEffect, GUILD_ICON_ID, GUILD_ICON_SCALE, config);

    expect(spec.lines[0].fallbackSizeMm).toBe(NAME_SIZE_MM);
  });

  it("gives a two-line name no fallback size", () => {
    const spec = buildCharacterTokenSpec(arcEffect, GUILD_ICON_ID, GUILD_ICON_SCALE, config);

    expect(spec.lines.map((line) => line.fallbackSizeMm)).toEqual([undefined, undefined]);
  });

  it("prints an effect with no second line at the single-line size too", () => {
    const spec = buildCharacterTokenSpec(nameOnlyEffect, GUILD_ICON_ID, GUILD_ICON_SCALE, config);

    expect(spec.lines.map((line) => [line.text, line.sizeMm])).toEqual([
      [nameOnlyEffect.name, SINGLE_LINE_NAME_SIZE_MM],
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
