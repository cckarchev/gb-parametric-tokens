import { describe, expect, it } from "vitest";

import { buildDefaultSelection } from "./buildDefaultSelection";
import type { GuildCatalog } from "./catalogTypes";
import { GENERIC_CATALOG_ID } from "./genericCatalog";
import { characterAoeTemplateId } from "./token-items/tokenItem";

const catalog: GuildCatalog = {
  guildId: "brewers",
  name: "Brewers",
  color: "#cdb320",
  characters: [
    {
      name: "Tapper",
      effects: ["commandingAura", "markedTarget"],
    },
    {
      name: "Spigot",
      effects: [],
    },
  ],
  genericTokens: [{ name: "Beer Token" }, { name: "Keg Token" }],
  conditions: [
    { id: "poison", name: "Poison", iconId: "poison" },
    { id: "burning", name: "Burning", iconId: "burning" },
  ],
  appliedConditionIds: ["burning"],
  gamePlans: [],
};

describe("buildDefaultSelection", () => {
  it("selects every character token from every character in the catalog", () => {
    const selection = buildDefaultSelection(catalog);

    expect(selection.characterTokenIds).toEqual(["Tapper-0", "Tapper-1"]);
  });

  it("leaves character token copies empty so fields fall back to their own default", () => {
    const selection = buildDefaultSelection(catalog);

    expect(selection.characterTokenCopies).toEqual({});
  });

  it("enables every generic token at the minimum copy count", () => {
    const selection = buildDefaultSelection(catalog);

    expect(selection.genericTokens).toEqual({
      "Beer Token": { enabled: true, copies: 1 },
      "Keg Token": { enabled: true, copies: 1 },
    });
  });

  it("enables influence, momentum, and goal influence with their typical game counts", () => {
    const selection = buildDefaultSelection(catalog);

    expect(selection.influence).toEqual({ enabled: true, copies: 13 });
    expect(selection.momentum).toEqual({ enabled: true, copies: 15 });
    expect(selection.goalInfluence).toEqual({ enabled: true, copies: 2 });
  });

  it("enables only the conditions the guild applies, keyed by id, all with a few copies", () => {
    const selection = buildDefaultSelection(catalog);

    expect(selection.conditions).toEqual({
      poison: { enabled: false, copies: 4 },
      burning: { enabled: true, copies: 4 },
    });
  });
});

describe("buildDefaultSelection game plans and empty catalogs", () => {
  it("enables every game plan, at its max copies when it has one", () => {
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

    const selection = buildDefaultSelection(catalogWithGamePlans);

    expect(selection.gamePlans).toEqual({
      extraShot: { enabled: true, copies: 2 },
      nowhereToHide: { enabled: true, copies: 1 },
    });
  });

  it("leaves the generic catalog's crest counters unchecked, at their usual counts", () => {
    const genericCatalog: GuildCatalog = {
      ...catalog,
      guildId: GENERIC_CATALOG_ID,
    };

    const selection = buildDefaultSelection(genericCatalog);

    expect(selection.influence).toEqual({ enabled: false, copies: 13 });
    expect(selection.momentum).toEqual({ enabled: false, copies: 15 });
    expect(selection.goalInfluence).toEqual({ enabled: false, copies: 2 });
  });

  it("selects nothing for a catalog with no characters or generic tokens", () => {
    const emptyCatalog: GuildCatalog = {
      guildId: "empty",
      name: "Empty",
      color: "#000000",
      characters: [],
      genericTokens: [],
      conditions: [],
      appliedConditionIds: [],
      gamePlans: [],
    };

    const selection = buildDefaultSelection(emptyCatalog);

    expect(selection.characterTokenIds).toEqual([]);
    expect(selection.genericTokens).toEqual({});
    expect(selection.conditions).toEqual({});
    expect(selection.gamePlans).toEqual({});
  });
});

describe("buildDefaultSelection AOE templates", () => {
  it("selects a character's AOE templates by default too", () => {
    const blacksmithsCatalog: GuildCatalog = {
      guildId: "blacksmiths",
      name: "Blacksmiths",
      color: "#82969f",
      characters: [
        { name: "Cutlass", effects: [], aoeTemplates: ["broadside"] },
      ],
      genericTokens: [],
      conditions: [],
      appliedConditionIds: [],
      gamePlans: [],
    };

    expect(buildDefaultSelection(blacksmithsCatalog).characterTokenIds).toEqual(
      [characterAoeTemplateId("Cutlass", 0)],
    );
  });
});
