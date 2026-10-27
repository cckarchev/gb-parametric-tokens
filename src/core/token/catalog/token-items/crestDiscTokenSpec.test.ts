import { describe, expect, it } from "vitest";

import { buildCrestDiscTokenSpec } from "./crestDiscTokenSpec";
import { DEFAULT_SHARED_CONFIG } from "./defaultSharedConfig";
import type { SharedConfig } from "./tokenItem";

const GUILD_ICON_ID = "Brewers";
const GUILD_ICON_SCALE = 1.5;
const CREST_SCALE = 0.5;

const config: SharedConfig = {
  ...DEFAULT_SHARED_CONFIG,
  discToken: { crestScale: CREST_SCALE },
};

describe("buildCrestDiscTokenSpec", () => {
  it("builds a flat disc with no text and one centered icon", () => {
    const spec = buildCrestDiscTokenSpec(
      GUILD_ICON_ID,
      GUILD_ICON_ID,
      GUILD_ICON_SCALE,
      config,
    );

    expect(spec.shape).toBe(config.discShape);
    expect(spec.textLayout).toBe("flat");
    expect(spec.lines).toEqual([]);
    expect(spec.decorations).toEqual([]);
    expect(spec.icons).toHaveLength(1);
    expect(spec.icons[0].iconId).toBe(GUILD_ICON_ID);
    expect(spec.icons[0].side).toBe("center");
  });

  it("applies the guild's crest scale only to the guild's own crest", () => {
    const crest = buildCrestDiscTokenSpec(
      GUILD_ICON_ID,
      GUILD_ICON_ID,
      GUILD_ICON_SCALE,
      config,
    );
    const custom = buildCrestDiscTokenSpec(
      "ball",
      GUILD_ICON_ID,
      GUILD_ICON_SCALE,
      config,
    );

    expect(crest.icons[0].scale).toBeCloseTo(CREST_SCALE * GUILD_ICON_SCALE);
    expect(custom.icons[0].scale).toBeCloseTo(CREST_SCALE);
  });
});
