import { describe, expect, it } from "vitest";

import charactersData from "../../../data/characters.json";
import effectsData from "../../../data/effects.json";
import { resolveEffect } from "./effects";

// Biome's useNamingConvention default for identifiers: lower camelCase, ASCII letters and digits.
const CAMEL_CASE_ID = /^[a-z][a-zA-Z0-9]*$/;

describe("resolveEffect", () => {
  it("resolves a known effect by its id from the bundled catalog", () => {
    expect(resolveEffect("aboutTheirNecks")).toEqual({
      id: "aboutTheirNecks",
      name: "About Their Necks",
      effect: "Enemies -1 TAC",
    });
  });

  it("throws for an unknown effect id", () => {
    expect(() => resolveEffect("notARealEffect")).toThrow('Unknown effect "notARealEffect"');
  });
});

describe("effects.json", () => {
  it("gives every effect a camelCase id", () => {
    const ids = effectsData.map((effect) => effect.id);
    const invalidIds = ids.filter((id) => !CAMEL_CASE_ID.test(id));

    expect(invalidIds).toEqual([]);
  });

  it("never reuses an id", () => {
    const ids = effectsData.map((effect) => effect.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicateIds).toEqual([]);
  });

  it("only uses layouts the token builders know", () => {
    const knownLayouts = new Set([undefined, "ring"]);
    const unknownLayouts = effectsData
      .map((effect) => effect.layout)
      .filter((layout) => !knownLayouts.has(layout));

    expect(unknownLayouts).toEqual([]);
  });

  it("only marks an effect repeatable with a literal true", () => {
    const invalidFlags = effectsData
      .map((effect) => effect.repeatable)
      .filter((repeatable) => repeatable !== undefined && repeatable !== true);

    expect(invalidFlags).toEqual([]);
  });

  it("marks a play that isn't once per turn as repeatable and a once-per-turn one as not", () => {
    expect(resolveEffect("markedTarget").repeatable).toBe(true);
    expect(resolveEffect("commandingAura").repeatable).toBeUndefined();
  });

  it("only lets characters reference effect ids that exist", () => {
    const knownIds = new Set(effectsData.map((effect) => effect.id));
    const unknownReferences = charactersData.flatMap((character) =>
      character.effects.filter((effectId) => !knownIds.has(effectId)),
    );

    expect(unknownReferences).toEqual([]);
  });
});
