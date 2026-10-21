import { describe, expect, it } from "vitest";

import type { GuildCatalog } from "../catalogTypes";
import { conditionsForGuild } from "../conditions";
import { resolveEffect } from "../effects";
import { buildTokenItems } from "./buildTokenItems";
import { DEFAULT_SHARED_CONFIG } from "./defaultSharedConfig";
import { DEFAULT_TOKEN_COPIES } from "./resolveTokenCopies";
import {
  characterAoeTemplateId,
  characterTokenId,
  conditionTokenId,
  gamePlanTokenId,
  type SharedConfig,
  type TokenSelection,
} from "./tokenItem";

// A deliberately tiny guild, but every character and effect named here is a real entry in the
// catalog data, so the fixture describes a roster that could actually exist.
const catalog: GuildCatalog = {
  guildId: "brewers",
  name: "Brewers",
  color: "#cdb320",
  characters: [
    { name: "Tapper", effects: ["commandingAura", "goad"] },
    { name: "Spigot", effects: ["timesCalled"] },
  ],
  genericTokens: [{ name: "Beer Token" }],
  conditions: [],
  appliedConditionIds: [],
  gamePlans: [],
};

const sharedConfig: SharedConfig = {
  ...DEFAULT_SHARED_CONFIG,
  arcShape: {
    type: "arc",
    ribbonWidthMm: 15,
    ribbonLengthMm: 20,
    studDiameterMm: 24,
  },
  discShape: { type: "disc", diameterMm: 25 },
  fitPolicy: {
    minTracking: 0,
    maxTracking: 0.3,
    minScale: 0.7,
    allowTwoLines: true,
  },
  printProfileId: "fdm-04",
  influenceIconId: "Brewers",
  nameSizeMm: 6,
  effectSizeMm: 4,
  // Keeps the icon assertions below free of an overflowBehavior field; the overflow tests set
  // their own.
  iconOverflowBehavior: "none",
};

const emptySelection: TokenSelection = {
  characterTokenIds: [],
  characterTokenCopies: {},
  genericTokens: {},
  influence: { enabled: false, copies: 1 },
  momentum: { enabled: false, copies: 1 },
  goalInfluence: { enabled: false, copies: 1 },
  conditions: {},
  gamePlans: {},
};

// Read from the data, so a wording edit doesn't break tests about line sizes. The first test
// keeps the literal, as proof the real text reaches the line.
//
// Cutlass has no effects of its own; Broadside places two AOEs, so it carries the copies case.
const blacksmithsCatalog: GuildCatalog = {
  guildId: "blacksmiths",
  name: "Blacksmiths",
  color: "#82969f",
  characters: [{ name: "Cutlass", effects: [], aoeTemplates: ["broadside"] }],
  genericTokens: [],
  conditions: [],
  appliedConditionIds: [],
  gamePlans: [],
};

const commandingAuraText = resolveEffect("commandingAura").effect;

describe("buildTokenItems", () => {
  it("includes only the character tokens listed in the selection", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 0)],
    };

    const items = buildTokenItems(catalog, selection, sharedConfig);

    expect(items).toHaveLength(1);
    expect(items[0].label).toBe("Tapper: Commanding Aura");
    expect(items[0].group).toBe("Tapper");
    expect(items[0].name).toBe("Commanding Aura");
    expect(items[0].copies).toBe(1);
    expect(items[0].spec.shape).toEqual(sharedConfig.arcShape);
    expect(items[0].spec.lines).toEqual([
      { text: "Commanding Aura", sizeMm: 6, colorGroup: "text" },
      { text: '4" Aura: +1 TAC +1 DMG', sizeMm: 4, colorGroup: "text" },
    ]);
  });

  it("uses the shared config's name and effect text sizes for each line, not a fixed constant", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 0)],
    };
    const customConfig: SharedConfig = {
      ...sharedConfig,
      nameSizeMm: 8.5,
      effectSizeMm: 5,
    };

    const items = buildTokenItems(catalog, selection, customConfig);

    expect(items[0].spec.lines).toEqual([
      { text: "Commanding Aura", sizeMm: 8.5, colorGroup: "text" },
      { text: commandingAuraText, sizeMm: 5, colorGroup: "text" },
    ]);
  });

  it("omits the second line for a token with no effect text", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 1)],
    };

    const items = buildTokenItems(catalog, selection, sharedConfig);

    expect(items[0].spec.lines).toEqual([
      {
        text: "Goad",
        sizeMm: sharedConfig.characterToken.singleLineNameSizeMm,
        fallbackSizeMm: sharedConfig.nameSizeMm,
        colorGroup: "text",
      },
    ]);
  });

  it("omits the second line entirely when showSecondLine is off, even if the token has effect text", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 0)],
    };
    const customConfig: SharedConfig = {
      ...sharedConfig,
      showSecondLine: false,
    };

    const items = buildTokenItems(catalog, selection, customConfig);

    expect(items[0].spec.lines).toEqual([
      {
        text: "Commanding Aura",
        sizeMm: sharedConfig.characterToken.singleLineNameSizeMm,
        fallbackSizeMm: sharedConfig.nameSizeMm,
        colorGroup: "text",
      },
    ]);
  });

  it("shrinks the name and grows the effect text when balanceTwoLineSizes is on", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 0)],
    };
    const customConfig: SharedConfig = {
      ...sharedConfig,
      balanceTwoLineSizes: true,
    };

    const items = buildTokenItems(catalog, selection, customConfig);

    expect(items[0].spec.lines).toEqual([
      { text: "Commanding Aura", sizeMm: 5.4, colorGroup: "text" },
      { text: commandingAuraText, sizeMm: 4.8, colorGroup: "text" },
    ]);
  });

  it("gives a single-line character token the single-line size, untouched by balanceTwoLineSizes", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 1)],
    };
    const customConfig: SharedConfig = {
      ...sharedConfig,
      balanceTwoLineSizes: true,
    };

    const items = buildTokenItems(catalog, selection, customConfig);

    expect(items[0].spec.lines).toEqual([
      {
        text: "Goad",
        sizeMm: sharedConfig.characterToken.singleLineNameSizeMm,
        fallbackSizeMm: sharedConfig.nameSizeMm,
        colorGroup: "text",
      },
    ]);
  });

  it("defaults a character token's icon to the guild's own icon id, tagged with the text color group", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 1)],
    };

    const items = buildTokenItems(catalog, selection, sharedConfig);

    expect(items[0].spec.icons).toEqual([
      { iconId: "Brewers", side: "left", scale: 0.85, colorGroup: "text" },
      { iconId: "Brewers", side: "right", scale: 0.85, colorGroup: "text" },
    ]);
  });

  it("defaults iconOverflowBehavior to 'grow'", () => {
    expect(DEFAULT_SHARED_CONFIG.iconOverflowBehavior).toBe("grow");
  });

  it("leaves overflowBehavior unset on every icon when iconOverflowBehavior is 'none'", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 1)],
    };

    const items = buildTokenItems(catalog, selection, sharedConfig);

    for (const icon of items[0].spec.icons) {
      expect(icon.overflowBehavior).toBeUndefined();
    }
  });

  it.each(["shrink", "trim", "grow"] as const)(
    "marks every icon overflowBehavior '%s' when iconOverflowBehavior is '%s'",
    (behavior) => {
      const selection: TokenSelection = {
        ...emptySelection,
        characterTokenIds: [characterTokenId("Tapper", 1)],
      };
      const customConfig: SharedConfig = {
        ...sharedConfig,
        iconOverflowBehavior: behavior,
      };

      const items = buildTokenItems(catalog, selection, customConfig);

      expect(items[0].spec.icons).toEqual([
        {
          iconId: "Brewers",
          side: "left",
          scale: 0.85,
          colorGroup: "text",
          overflowBehavior: behavior,
        },
        {
          iconId: "Brewers",
          side: "right",
          scale: 0.85,
          colorGroup: "text",
          overflowBehavior: behavior,
        },
      ]);
    },
  );

  it("uses the requested copies count for a repeatable character token", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Spigot", 0)],
      characterTokenCopies: { [characterTokenId("Spigot", 0)]: 5 },
    };

    const items = buildTokenItems(catalog, selection, sharedConfig);

    expect(items).toHaveLength(1);
    expect(items[0].copies).toBe(5);
  });

  it("defaults a selected repeatable character token to 2 copies when no count was chosen yet", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Spigot", 0)],
    };

    const items = buildTokenItems(catalog, selection, sharedConfig);

    expect(items[0].copies).toBe(DEFAULT_TOKEN_COPIES);
  });

  it("ignores a leftover copies count for a token that isn't selected", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [],
      characterTokenCopies: { [characterTokenId("Tapper", 0)]: 2 },
    };

    const items = buildTokenItems(catalog, selection, sharedConfig);

    expect(items).toHaveLength(0);
  });

  it("caps a repeatable character token at 6 copies", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Spigot", 0)],
      characterTokenCopies: { [characterTokenId("Spigot", 0)]: 9 },
    };

    const items = buildTokenItems(catalog, selection, sharedConfig);

    expect(items[0].copies).toBe(6);
  });

  it("always prints a single copy of a token that isn't repeatable, like a once-per-turn play", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 0)],
      characterTokenCopies: { [characterTokenId("Tapper", 0)]: 5 },
    };

    const items = buildTokenItems(catalog, selection, sharedConfig);

    expect(items[0].copies).toBe(1);
  });

  it("excludes a disabled generic token and includes an enabled one with its chosen count", () => {
    const disabled = buildTokenItems(
      catalog,
      {
        ...emptySelection,
        genericTokens: { "Beer Token": { enabled: false, copies: 3 } },
      },
      sharedConfig,
    );

    expect(disabled).toHaveLength(0);

    const enabled = buildTokenItems(
      catalog,
      {
        ...emptySelection,
        genericTokens: { "Beer Token": { enabled: true, copies: 3 } },
      },
      sharedConfig,
    );

    expect(enabled).toHaveLength(1);
    expect(enabled[0].copies).toBe(3);
    expect(enabled[0].spec.shape).toEqual(sharedConfig.discShape);
    expect(enabled[0].group).toBeUndefined();
    expect(enabled[0].name).toBe("Beer Token");
  });

  it("includes a single, unnumbered Influence item carrying the requested copies count", () => {
    const items = buildTokenItems(
      catalog,
      { ...emptySelection, influence: { enabled: true, copies: 13 } },
      sharedConfig,
    );

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("influence");
    expect(items[0].label).toBe("Influence");
    expect(items[0].group).toBeUndefined();
    expect(items[0].name).toBe("Influence");
    expect(items[0].copies).toBe(13);
    expect(items[0].spec.lines).toEqual([]);
    expect(items[0].spec.icons).toEqual([
      { iconId: "Brewers", side: "center", scale: 0.85, colorGroup: "text" },
    ]);
  });

  it("generates no Influence item when influence is disabled", () => {
    const items = buildTokenItems(
      catalog,
      { ...emptySelection, influence: { enabled: false, copies: 13 } },
      sharedConfig,
    );

    expect(items).toHaveLength(0);
  });

  it("includes a single Momentum item with fixed 'MP' text and a plain ring border, no covering icon", () => {
    const items = buildTokenItems(
      catalog,
      { ...emptySelection, momentum: { enabled: true, copies: 10 } },
      sharedConfig,
    );

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("momentum");
    expect(items[0].label).toBe("Momentum");
    expect(items[0].copies).toBe(10);
    expect(items[0].spec.lines).toEqual([
      { text: "MP", sizeMm: expect.any(Number), colorGroup: "text" },
    ]);
    expect(items[0].spec.icons).toEqual([]);
    expect(items[0].spec.decorations).toEqual([
      expect.objectContaining({ type: "ring", colorGroup: "text" }),
    ]);
  });

  // Momentum is the one token kind that opts out of the shared fitPolicy: its text is the fixed
  // two-character "MP", which always fits, so it never wants tracking or shrinking applied.
  it("gives the Momentum item its own fitPolicy instead of the shared one", () => {
    const items = buildTokenItems(
      catalog,
      { ...emptySelection, momentum: { enabled: true, copies: 1 } },
      sharedConfig,
    );

    expect(items[0].spec.fitPolicy).toEqual({
      minTracking: 0,
      maxTracking: 0,
      minScale: 1,
      allowTwoLines: false,
    });
    expect(items[0].spec.fitPolicy).not.toEqual(sharedConfig.fitPolicy);
  });

  it("gives every other token kind the shared fitPolicy", () => {
    const items = buildTokenItems(
      catalog,
      { ...emptySelection, influence: { enabled: true, copies: 1 } },
      sharedConfig,
    );

    expect(items[0].spec.fitPolicy).toEqual(sharedConfig.fitPolicy);
  });

  it("generates no Momentum item when momentum is disabled", () => {
    const items = buildTokenItems(
      catalog,
      { ...emptySelection, momentum: { enabled: false, copies: 10 } },
      sharedConfig,
    );

    expect(items).toHaveLength(0);
  });

  it("includes a single Goal Influence item carrying the requested copies count, ring-styled with the guild icon centered", () => {
    const items = buildTokenItems(
      catalog,
      { ...emptySelection, goalInfluence: { enabled: true, copies: 2 } },
      sharedConfig,
    );

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("goal-influence");
    expect(items[0].copies).toBe(2);
    expect(items[0].spec.shape).toEqual(sharedConfig.goalInfluenceShape);
    expect(items[0].spec.textLayout).toBe("ring");
    expect(items[0].spec.lines.map((line) => line.text)).toEqual([
      "Goal",
      "Influence",
    ]);
    expect(items[0].spec.icons).toEqual([
      {
        iconId: "Brewers",
        side: "center",
        scale: expect.any(Number),
        colorGroup: "text",
      },
    ]);
    // No ring border: around a crest that isn't round it reads as a second circle.
    expect(items[0].spec.decorations).toEqual([]);
  });

  it("positions the bottom ring line further from center than the top one, so their ink lines up", () => {
    const items = buildTokenItems(
      catalog,
      { ...emptySelection, goalInfluence: { enabled: true, copies: 1 } },
      sharedConfig,
    );

    const [topLine, bottomLine] = items[0].spec.lines;

    // The top line's ink grows outward from its baseline and the bottom line's inward, so the
    // bottom baseline sits farther out for both lines' ink to line up (see computeRingTextRadii).
    expect(bottomLine.radiusMm).toBeGreaterThan(topLine.radiusMm ?? 0);
  });

  it("builds a ring-layout character token like Goal Influence, with the effect's name on top and its text below", () => {
    const masonsCatalog: GuildCatalog = {
      guildId: "masons",
      name: "Masons",
      color: "#416abb",
      characters: [{ name: "Honour", effects: ["toppingOutInfluence"] }],
      genericTokens: [],
      conditions: [],
      appliedConditionIds: [],
      gamePlans: [],
    };
    const tokenId = characterTokenId("Honour", 0);
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [tokenId],
      characterTokenCopies: { [tokenId]: 6 },
    };

    const items = buildTokenItems(masonsCatalog, selection, sharedConfig);

    expect(items).toHaveLength(1);
    expect(items[0].copies).toBe(6);
    expect(items[0].spec.shape).toEqual(sharedConfig.goalInfluenceShape);
    expect(items[0].spec.textLayout).toBe("ring");
    expect(items[0].spec.lines.map((line) => line.text)).toEqual([
      "Topping Out!",
      "+1 INF",
    ]);
    expect(items[0].spec.icons).toEqual([
      {
        iconId: "Masons",
        side: "center",
        scale: expect.any(Number),
        colorGroup: "text",
      },
    ]);
  });

  it("tells apart a character's tokens that share a name by appending their effect text", () => {
    const masonsCatalog: GuildCatalog = {
      guildId: "masons",
      name: "Masons",
      color: "#416abb",
      characters: [
        { name: "Hammer", effects: ["hammerTimeDmg", "hammerTimeMov"] },
      ],
      genericTokens: [],
      conditions: [],
      appliedConditionIds: [],
      gamePlans: [],
    };
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [
        characterTokenId("Hammer", 0),
        characterTokenId("Hammer", 1),
      ],
    };

    const items = buildTokenItems(masonsCatalog, selection, sharedConfig);

    expect(items.map((item) => item.name)).toEqual([
      "Hammer Time! (+1 DMG)",
      'Hammer Time! (+2"/+2" MOV)',
    ]);
    expect(items[0].label).toBe("Hammer: Hammer Time! (+1 DMG)");
    expect(items[0].spec.lines[0].text).toBe("Hammer Time!");
  });

  it("generates no Goal Influence item when goalInfluence is disabled", () => {
    const items = buildTokenItems(
      catalog,
      { ...emptySelection, goalInfluence: { enabled: false, copies: 2 } },
      sharedConfig,
    );

    expect(items).toHaveLength(0);
  });

  it("multiplies the guild crest icon's scale by the catalog's iconScale on a character token", () => {
    const scaledCatalog: GuildCatalog = { ...catalog, iconScale: 1.5 };
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 1)],
    };

    const items = buildTokenItems(scaledCatalog, selection, sharedConfig);

    expect(items[0].spec.icons).toEqual([
      {
        iconId: "Brewers",
        side: "left",
        scale: 0.85 * 1.5,
        colorGroup: "text",
      },
      {
        iconId: "Brewers",
        side: "right",
        scale: 0.85 * 1.5,
        colorGroup: "text",
      },
    ]);
  });

  it("multiplies the guild crest icon's scale by the catalog's iconScale on a generic token", () => {
    const scaledCatalog: GuildCatalog = { ...catalog, iconScale: 1.5 };

    const items = buildTokenItems(
      scaledCatalog,
      {
        ...emptySelection,
        genericTokens: { "Beer Token": { enabled: true, copies: 1 } },
      },
      sharedConfig,
    );

    expect(items[0].spec.icons).toEqual([
      {
        iconId: "Brewers",
        side: "center",
        scale: 0.85 * 1.5,
        colorGroup: "text",
      },
    ]);
  });

  it("multiplies the guild crest icon's scale by the catalog's iconScale on Goal Influence", () => {
    const scaledCatalog: GuildCatalog = { ...catalog, iconScale: 1.5 };
    const goalInfluenceSelection: TokenSelection = {
      ...emptySelection,
      goalInfluence: { enabled: true, copies: 1 },
    };

    const unscaledItems = buildTokenItems(
      catalog,
      goalInfluenceSelection,
      sharedConfig,
    );
    const scaledItems = buildTokenItems(
      scaledCatalog,
      goalInfluenceSelection,
      sharedConfig,
    );

    expect(scaledItems[0].spec.icons[0].scale).toBeCloseTo(
      unscaledItems[0].spec.icons[0].scale * 1.5,
    );
  });

  it("multiplies the guild crest icon's scale by the catalog's iconScale on Influence, which wears the guild crest too", () => {
    const scaledCatalog: GuildCatalog = { ...catalog, iconScale: 1.5 };

    const items = buildTokenItems(
      scaledCatalog,
      { ...emptySelection, influence: { enabled: true, copies: 1 } },
      sharedConfig,
    );

    expect(items[0].spec.icons).toEqual([
      {
        iconId: "Brewers",
        side: "center",
        scale: 0.85 * 1.5,
        colorGroup: "text",
      },
    ]);
  });

  it("defaults the catalog's iconScale to 1 when omitted, leaving the guild crest scale untouched", () => {
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 1)],
    };

    const items = buildTokenItems(catalog, selection, sharedConfig);

    expect(items[0].spec.icons[0].scale).toBe(0.85);
  });

  it("builds an AOE template item for a selected template, with its copies", () => {
    const templateId = characterAoeTemplateId("Cutlass", 0);
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [templateId],
      characterTokenCopies: { [templateId]: 2 },
    };

    const items = buildTokenItems(blacksmithsCatalog, selection, sharedConfig);
    const template = items.find((item) => item.id === templateId);

    expect(template?.label).toBe("Cutlass: Broadside (AOE)");
    expect(template?.group).toBe("Cutlass");
    expect(template?.name).toBe("Broadside (AOE)");
    expect(template?.copies).toBe(2);
    expect(template?.spec.textLayout).toBe("ring");
  });

  it("skips an AOE template that is not selected", () => {
    const items = buildTokenItems(
      blacksmithsCatalog,
      emptySelection,
      sharedConfig,
    );

    expect(items).toEqual([]);
  });

  it("excludes a disabled condition and includes an enabled one with its chosen count and icon", () => {
    const catalogWithConditions: GuildCatalog = {
      ...catalog,
      conditions: [
        { id: "poison", name: "Poison", iconId: "poison" },
        { id: "knockedDown", name: "Knocked Down", iconId: "knock-down" },
      ],
    };

    const selection: TokenSelection = {
      ...emptySelection,
      conditions: {
        poison: { enabled: false, copies: 4 },
        knockedDown: { enabled: true, copies: 3 },
      },
    };

    const items = buildTokenItems(
      catalogWithConditions,
      selection,
      sharedConfig,
    );

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("condition-knockedDown");
    expect(items[0].label).toBe("Knocked Down");
    expect(items[0].name).toBe("Knocked Down");
    expect(items[0].group).toBeUndefined();
    expect(items[0].copies).toBe(3);
    expect(items[0].spec.icons[0].iconId).toBe("knock-down");
  });

  it("skips a condition the selection has no entry for", () => {
    const catalogWithConditions: GuildCatalog = {
      ...catalog,
      conditions: [{ id: "poison", name: "Poison", iconId: "poison" }],
    };

    const items = buildTokenItems(
      catalogWithConditions,
      emptySelection,
      sharedConfig,
    );

    expect(items).toEqual([]);
  });

  it("builds an arc token for an enabled game plan, with its effect below and the crest on both sides", () => {
    const catalogWithGamePlans: GuildCatalog = {
      ...catalog,
      gamePlans: [
        {
          id: "extraShot",
          name: "Extra Shot",
          effect: "+1 TAC, free Sprint",
          maxCopies: 2,
        },
        { id: "nowhereToHide", name: "Nowhere to Hide", effect: "No cover" },
      ],
    };

    const selection: TokenSelection = {
      ...emptySelection,
      gamePlans: {
        extraShot: { enabled: true, copies: 2 },
        nowhereToHide: { enabled: false, copies: 1 },
      },
    };

    const items = buildTokenItems(
      catalogWithGamePlans,
      selection,
      sharedConfig,
    );
    const [item] = items;

    expect(items).toHaveLength(1);
    expect(item.id).toBe(gamePlanTokenId("extraShot"));
    expect(item.label).toBe("Extra Shot");
    expect(item.name).toBe("Extra Shot");
    expect(item.group).toBeUndefined();
    expect(item.copies).toBe(2);
    expect(item.spec.textLayout).toBe("arc");
    expect(item.spec.lines.map((line) => line.text)).toEqual([
      "Extra Shot",
      "+1 TAC, free Sprint",
    ]);
    expect(item.spec.icons.map((icon) => icon.iconId)).toEqual([
      "Brewers",
      "Brewers",
    ]);
  });

  it("orders items like the panels: characters, game plans, guild tokens, then conditions", () => {
    const [condition] = conditionsForGuild("brewers");
    const fullCatalog: GuildCatalog = {
      ...catalog,
      conditions: [condition],
      gamePlans: [
        { id: "nowhereToHide", name: "Nowhere to Hide", effect: "No cover" },
      ],
    };
    const enabledCounter = { enabled: true, copies: 1 };
    const selection: TokenSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("Tapper", 0)],
      genericTokens: { "Beer Token": enabledCounter },
      influence: enabledCounter,
      momentum: enabledCounter,
      goalInfluence: enabledCounter,
      conditions: { [condition.id]: enabledCounter },
      gamePlans: { nowhereToHide: enabledCounter },
    };

    const items = buildTokenItems(fullCatalog, selection, sharedConfig);

    expect(items.map((item) => item.id)).toEqual([
      characterTokenId("Tapper", 0),
      gamePlanTokenId("nowhereToHide"),
      "influence",
      "momentum",
      "goal-influence",
      "Beer Token",
      conditionTokenId(condition.id),
    ]);
  });

  it("skips a game plan the selection has no entry for", () => {
    const catalogWithGamePlans: GuildCatalog = {
      ...catalog,
      gamePlans: [
        { id: "nowhereToHide", name: "Nowhere to Hide", effect: "No cover" },
      ],
    };

    const items = buildTokenItems(
      catalogWithGamePlans,
      emptySelection,
      sharedConfig,
    );

    expect(items).toEqual([]);
  });
});
