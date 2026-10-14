import { describe, expect, it } from "vitest";

import aoeTemplatesData from "@/data/aoeTemplates.json";
import charactersData from "@/data/characters.json";

import { resolveAoeTemplate } from "./aoeTemplates";
import { CatalogCharacter } from "./catalogTypes";

// Biome's useNamingConvention default for identifiers: lower camelCase, ASCII letters and digits.
const CAMEL_CASE_ID = /^[a-z][a-zA-Z0-9]*$/;

const characters: CatalogCharacter[] = charactersData;

describe("resolveAoeTemplate", () => {
  it("resolves a known template by its id from the bundled catalog", () => {
    expect(resolveAoeTemplate("broadside")).toEqual({
      id: "broadside",
      name: "Broadside",
      effect: "Rough Terrain",
      maxCopies: 2,
    });
  });

  it("throws for an unknown template id", () => {
    expect(() => resolveAoeTemplate("notARealTemplate")).toThrow(
      'Unknown AOE template "notARealTemplate"',
    );
  });
});

describe("aoeTemplates.json", () => {
  it("gives every template a camelCase id", () => {
    const ids = aoeTemplatesData.map((template) => template.id);
    const invalidIds = ids.filter((id) => !CAMEL_CASE_ID.test(id));

    expect(invalidIds).toEqual([]);
  });

  it("never reuses an id", () => {
    const ids = aoeTemplatesData.map((template) => template.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicateIds).toEqual([]);
  });

  it("only lets characters reference template ids that exist", () => {
    const knownIds = new Set(aoeTemplatesData.map((template) => template.id));
    const unknownReferences = characters.flatMap((character) =>
      (character.aoeTemplates ?? []).filter((templateId) => !knownIds.has(templateId)),
    );

    expect(unknownReferences).toEqual([]);
  });

  it("gives every template at least one owner", () => {
    const referencedIds = new Set(characters.flatMap((character) => character.aoeTemplates ?? []));
    const orphanIds = aoeTemplatesData
      .map((template) => template.id)
      .filter((id) => !referencedIds.has(id));

    expect(orphanIds).toEqual([]);
  });
});
