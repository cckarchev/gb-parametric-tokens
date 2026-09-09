import { describe, expect, it } from "vitest";

import {
  BatchSelection,
  BatchSharedConfig,
  buildBatchItems,
  characterTokenId,
} from "./buildBatchItems";
import { GuildCatalog } from "./catalogTypes";

const catalog: GuildCatalog = {
  guildId: "brewers",
  name: "Brewers",
  color: "#cdb320",
  characters: [
    {
      id: "tapper",
      name: "Tapper",
      tokens: [
        { title: "Commanding Aura", subtitle: '4" Aura +1 TAC +1 DMG' },
        { title: "Marked Target" },
      ],
    },
    {
      id: "spigot",
      name: "Spigot",
      tokens: [{ title: "Time's Called", subtitle: '4" Aura +2"/+2" MOV' }],
    },
  ],
  genericTokens: [{ id: "beer-token", name: "Beer Token" }],
};

const sharedConfig: BatchSharedConfig = {
  arcShape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, nobDiameterMm: 24 },
  discShape: { type: "disc", diameterMm: 25 },
  goalInfluenceShape: { type: "disc", diameterMm: 20 },
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
  printProfileId: "fdm-04",
  colorGroups: [{ id: "base", name: "Base", color: "#2B2B2B" }],
  influenceIconId: "Brewers",
  titleSizeMm: 6,
  subtitleSizeMm: 4,
};

const emptySelection: BatchSelection = {
  characterTokenIds: [],
  characterTokenCopies: {},
  genericTokens: {},
  influence: { enabled: false, copies: 1 },
  momentum: { enabled: false, copies: 1 },
  goalInfluence: { enabled: false, copies: 1 },
};

const catalogWithMultiCopyToken: GuildCatalog = {
  guildId: "cooks",
  name: "Cooks",
  color: "#e0a020",
  characters: [
    {
      id: "wellington",
      name: "Wellington",
      tokens: [{ title: "Singled Out", maxCopies: 2 }],
    },
  ],
  genericTokens: [],
};

describe("buildBatchItems", () => {
  it("includes only the character tokens listed in the selection", () => {
    const selection: BatchSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("tapper", 0)],
    };

    const items = buildBatchItems(catalog, selection, sharedConfig);

    expect(items).toHaveLength(1);
    expect(items[0].label).toBe("Tapper: Commanding Aura");
    expect(items[0].copies).toBe(1);
    expect(items[0].spec.shape).toEqual(sharedConfig.arcShape);
    expect(items[0].spec.lines).toEqual([
      { text: "Commanding Aura", sizeMm: 6, colorGroup: "text" },
      { text: '4" Aura +1 TAC +1 DMG', sizeMm: 4, colorGroup: "text" },
    ]);
  });

  it("uses the shared config's title and subtitle sizes for each line, not a fixed constant", () => {
    const selection: BatchSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("tapper", 0)],
    };
    const customConfig: BatchSharedConfig = {
      ...sharedConfig,
      titleSizeMm: 8.5,
      subtitleSizeMm: 5,
    };

    const items = buildBatchItems(catalog, selection, customConfig);

    expect(items[0].spec.lines).toEqual([
      { text: "Commanding Aura", sizeMm: 8.5, colorGroup: "text" },
      { text: '4" Aura +1 TAC +1 DMG', sizeMm: 5, colorGroup: "text" },
    ]);
  });

  it("omits the second line for a token with no subtitle", () => {
    const selection: BatchSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("tapper", 1)],
    };

    const items = buildBatchItems(catalog, selection, sharedConfig);

    expect(items[0].spec.lines).toEqual([{ text: "Marked Target", sizeMm: 6, colorGroup: "text" }]);
  });

  it("defaults a character token's icon to the guild's own icon id, tagged with the text color group", () => {
    const selection: BatchSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("tapper", 1)],
    };

    const items = buildBatchItems(catalog, selection, sharedConfig);

    expect(items[0].spec.icons).toEqual([
      { iconId: "Brewers", side: "left", scale: 0.85, colorGroup: "text" },
      { iconId: "Brewers", side: "right", scale: 0.85, colorGroup: "text" },
    ]);
  });

  it("uses the requested copies count for a character token with maxCopies set", () => {
    const selection: BatchSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("wellington", 0)],
      characterTokenCopies: { [characterTokenId("wellington", 0)]: 2 },
    };

    const items = buildBatchItems(catalogWithMultiCopyToken, selection, sharedConfig);

    expect(items).toHaveLength(1);
    expect(items[0].copies).toBe(2);
  });

  it("defaults a selected maxCopies token to 1 copy when no count was chosen yet", () => {
    const selection: BatchSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("wellington", 0)],
    };

    const items = buildBatchItems(catalogWithMultiCopyToken, selection, sharedConfig);

    expect(items[0].copies).toBe(1);
  });

  it("ignores a leftover copies count for a token that isn't selected", () => {
    const selection: BatchSelection = {
      ...emptySelection,
      characterTokenIds: [],
      characterTokenCopies: { [characterTokenId("wellington", 0)]: 2 },
    };

    const items = buildBatchItems(catalogWithMultiCopyToken, selection, sharedConfig);

    expect(items).toHaveLength(0);
  });

  it("ignores characterTokenCopies for a token without maxCopies, always using 1", () => {
    const selection: BatchSelection = {
      ...emptySelection,
      characterTokenIds: [characterTokenId("tapper", 0)],
      characterTokenCopies: { [characterTokenId("tapper", 0)]: 5 },
    };

    const items = buildBatchItems(catalog, selection, sharedConfig);

    expect(items[0].copies).toBe(1);
  });

  it("excludes a disabled generic token and includes an enabled one with its chosen count", () => {
    const disabled = buildBatchItems(
      catalog,
      { ...emptySelection, genericTokens: { "beer-token": { enabled: false, copies: 3 } } },
      sharedConfig,
    );

    expect(disabled).toHaveLength(0);

    const enabled = buildBatchItems(
      catalog,
      { ...emptySelection, genericTokens: { "beer-token": { enabled: true, copies: 3 } } },
      sharedConfig,
    );

    expect(enabled).toHaveLength(1);
    expect(enabled[0].copies).toBe(3);
    expect(enabled[0].spec.shape).toEqual(sharedConfig.discShape);
  });

  it("includes a single, unnumbered Influence item carrying the requested copies count", () => {
    const items = buildBatchItems(
      catalog,
      { ...emptySelection, influence: { enabled: true, copies: 13 } },
      sharedConfig,
    );

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("influence");
    expect(items[0].label).toBe("Influence");
    expect(items[0].copies).toBe(13);
    expect(items[0].spec.lines).toEqual([]);
    expect(items[0].spec.icons).toEqual([
      { iconId: "Brewers", side: "center", scale: 0.85, colorGroup: "text" },
    ]);
  });

  it("generates no Influence item when influence is disabled", () => {
    const items = buildBatchItems(
      catalog,
      { ...emptySelection, influence: { enabled: false, copies: 13 } },
      sharedConfig,
    );

    expect(items).toHaveLength(0);
  });

  it("includes a single Momentum item with fixed 'MP' text and a plain ring border, no covering icon", () => {
    const items = buildBatchItems(
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

  it("generates no Momentum item when momentum is disabled", () => {
    const items = buildBatchItems(
      catalog,
      { ...emptySelection, momentum: { enabled: false, copies: 10 } },
      sharedConfig,
    );

    expect(items).toHaveLength(0);
  });

  it("includes a single Goal Influence item carrying the requested copies count, ring-styled with the guild icon centered", () => {
    const items = buildBatchItems(
      catalog,
      { ...emptySelection, goalInfluence: { enabled: true, copies: 2 } },
      sharedConfig,
    );

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("goal-influence");
    expect(items[0].copies).toBe(2);
    expect(items[0].spec.shape).toEqual(sharedConfig.goalInfluenceShape);
    expect(items[0].spec.textLayout).toBe("ring");
    expect(items[0].spec.lines.map((line) => line.text)).toEqual(["Goal", "Influence"]);
    expect(items[0].spec.icons).toEqual([
      { iconId: "Brewers", side: "center", scale: expect.any(Number), colorGroup: "text" },
    ]);
    expect(items[0].spec.decorations).toEqual([
      expect.objectContaining({ type: "ring", colorGroup: "text" }),
    ]);
  });

  it("generates no Goal Influence item when goalInfluence is disabled", () => {
    const items = buildBatchItems(
      catalog,
      { ...emptySelection, goalInfluence: { enabled: false, copies: 2 } },
      sharedConfig,
    );

    expect(items).toHaveLength(0);
  });
});
