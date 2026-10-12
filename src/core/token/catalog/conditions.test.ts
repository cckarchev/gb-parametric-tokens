import { describe, expect, it } from "vitest";

import manifestData from "../../../../public/icons/manifest.json";
import { guildCatalogs } from "../../../browser/guildCatalogs";
import conditionsData from "../../../data/conditions.json";
import { allConditions, conditionsForGuild } from "./conditions";

// Biome's useNamingConvention default for identifiers: lower camelCase, ASCII letters and digits.
const CAMEL_CASE_ID = /^[a-z][a-zA-Z0-9]*$/;

const conditionNames = (guildId: string): string[] => {
  return conditionsForGuild(guildId).map((condition) => condition.name);
};

describe("conditionsForGuild", () => {
  it("gives every guild the conditions that are not tied to a guild", () => {
    expect(conditionNames("brewers")).toEqual([
      "Bleed",
      "Burning",
      "Knocked Down",
      "Poison",
      "Snared",
    ]);
  });

  it("adds a guild's own condition only to that guild", () => {
    expect(conditionNames("ratcatchers")).toContain("Disease");
    expect(conditionNames("brewers")).not.toContain("Disease");
  });

  it("returns only the shared conditions for a guild id it does not know", () => {
    expect(conditionNames("notARealGuild")).toEqual(conditionNames("brewers"));
  });
});

describe("allConditions", () => {
  it("offers every condition, guild-restricted ones included", () => {
    const names = allConditions().map((condition) => condition.name);

    expect(names).toEqual(conditionsData.map((condition) => condition.name));
    expect(names).toContain("Disease");
  });
});

describe("guild files' applied conditions", () => {
  it("only name conditions that guild is offered", () => {
    const unknownReferences = guildCatalogs.flatMap((catalog) => {
      const offeredIds = new Set(catalog.conditions.map((condition) => condition.id));

      return catalog.appliedConditionIds
        .filter((conditionId) => !offeredIds.has(conditionId))
        .map((conditionId) => `${catalog.guildId}: ${conditionId}`);
    });

    expect(unknownReferences).toEqual([]);
  });

  it("include knocked down for every guild, since every roster can inflict it", () => {
    const guildsWithoutKnockDown = guildCatalogs
      .filter((catalog) => !catalog.appliedConditionIds.includes("knockedDown"))
      .map((catalog) => catalog.guildId);

    expect(guildsWithoutKnockDown).toEqual([]);
  });
});

describe("conditions.json", () => {
  it("gives every condition a camelCase id", () => {
    const ids = conditionsData.map((condition) => condition.id);
    const invalidIds = ids.filter((id) => !CAMEL_CASE_ID.test(id));

    expect(invalidIds).toEqual([]);
  });

  it("never reuses an id", () => {
    const ids = conditionsData.map((condition) => condition.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicateIds).toEqual([]);
  });

  it("only points at condition icons that exist in the icon manifest", () => {
    const statusIconIds = new Set(
      manifestData.filter((entry) => entry.kind === "status").map((entry) => entry.id),
    );
    const unknownIconIds = conditionsData
      .map((condition) => condition.iconId)
      .filter((iconId) => !statusIconIds.has(iconId));

    expect(unknownIconIds).toEqual([]);
  });

  it("only restricts a condition to guilds that exist", () => {
    const knownGuildIds = new Set(guildCatalogs.map((catalog) => catalog.guildId));
    const unknownGuildIds = conditionsData
      .flatMap((condition) => condition.guilds ?? [])
      .filter((guildId) => !knownGuildIds.has(guildId));

    expect(unknownGuildIds).toEqual([]);
  });
});
