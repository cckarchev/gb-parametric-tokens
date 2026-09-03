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
        { line1: "Commanding Aura", line2: '4" Aura +1 TAC +1 DMG' },
        { line1: "Marked Target" },
      ],
    },
    {
      id: "spigot",
      name: "Spigot",
      tokens: [{ line1: "Time's Called", line2: '4" Aura +2"/+2" MOV' }],
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
  genericCopies: {},
  influenceCopies: 0,
  momentumCopies: 0,
  goalInfluenceCopies: 0,
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

  it("omits the second line for a token with no line2", () => {
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

  it("excludes generic tokens with zero copies and includes them with the chosen count", () => {
    const zeroCopies = buildBatchItems(
      catalog,
      { ...emptySelection, genericCopies: { "beer-token": 0 } },
      sharedConfig,
    );

    expect(zeroCopies).toHaveLength(0);

    const threeCopies = buildBatchItems(
      catalog,
      { ...emptySelection, genericCopies: { "beer-token": 3 } },
      sharedConfig,
    );

    expect(threeCopies).toHaveLength(1);
    expect(threeCopies[0].copies).toBe(3);
    expect(threeCopies[0].spec.shape).toEqual(sharedConfig.discShape);
  });

  it("includes a single, unnumbered Influence item carrying the requested copies count", () => {
    const items = buildBatchItems(
      catalog,
      { ...emptySelection, influenceCopies: 13 },
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

  it("generates no Influence item when influenceCopies is 0", () => {
    const items = buildBatchItems(catalog, { ...emptySelection, influenceCopies: 0 }, sharedConfig);

    expect(items).toHaveLength(0);
  });

  it("includes a single Momentum item with fixed 'MP' text and a plain ring border, no covering icon", () => {
    const items = buildBatchItems(catalog, { ...emptySelection, momentumCopies: 10 }, sharedConfig);

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

  it("generates no Momentum item when momentumCopies is 0", () => {
    const items = buildBatchItems(catalog, { ...emptySelection, momentumCopies: 0 }, sharedConfig);

    expect(items).toHaveLength(0);
  });

  it("includes a single Goal Influence item carrying the requested copies count, ring-styled with the guild icon centered", () => {
    const items = buildBatchItems(
      catalog,
      { ...emptySelection, goalInfluenceCopies: 2 },
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

  it("generates no Goal Influence item when goalInfluenceCopies is 0", () => {
    const items = buildBatchItems(
      catalog,
      { ...emptySelection, goalInfluenceCopies: 0 },
      sharedConfig,
    );

    expect(items).toHaveLength(0);
  });
});
