import { describe, expect, it } from "vitest";

import { GENERIC_CATALOG_ID } from "@/core/token/catalog/genericCatalog";
import conditionsData from "@/data/conditions.json";
import gamePlansData from "@/data/gamePlans.json";

import { loadGuildCatalog } from "./loadGuildCatalog";

describe("loadGuildCatalog", () => {
  it("loads the bundled catalog for the given guild id", () => {
    const result = loadGuildCatalog("brewers");

    expect(result.guildId).toBe("brewers");
    expect(result.name).toBe("Brewers");
  });

  it("loads the generic catalog: no roster, every condition preselected, and the game plans", () => {
    const result = loadGuildCatalog(GENERIC_CATALOG_ID);
    const conditionIds = conditionsData.map((condition) => condition.id);

    expect(result.name).toBe("Generic");
    expect(result.characters).toEqual([]);
    expect(result.genericTokens).toEqual([]);
    expect(result.conditions.map((condition) => condition.id)).toEqual(conditionIds);
    expect(result.appliedConditionIds).toEqual(conditionIds);
    expect(result.gamePlans).toEqual(gamePlansData);
  });

  it("gives every guild an empty game plan list, since the deck lives in the generic catalog", () => {
    expect(loadGuildCatalog("brewers").gamePlans).toEqual([]);
  });

  it("throws when no catalog file exists for the guild id", () => {
    expect(() => loadGuildCatalog("no-such-guild")).toThrow(
      'Failed to load catalog for guild "no-such-guild"',
    );
  });
});
