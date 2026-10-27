import { describe, expect, it } from "vitest";

import gamePlansData from "@/data/gamePlans.json";

import { gamePlans } from "./gamePlans";

// Biome's useNamingConvention default for identifiers: lower camelCase, ASCII
// letters and digits.
const CAMEL_CASE_ID = /^[a-z][a-zA-Z0-9]*$/;

describe("gamePlans.json", () => {
  it("is what the gamePlans catalog exposes", () => {
    expect(gamePlans).toEqual(gamePlansData);
  });

  it("gives every game plan a camelCase id", () => {
    const ids = gamePlansData.map((gamePlan) => gamePlan.id);
    const invalidIds = ids.filter((id) => !CAMEL_CASE_ID.test(id));

    expect(invalidIds).toEqual([]);
  });

  it("never reuses an id", () => {
    const ids = gamePlansData.map((gamePlan) => gamePlan.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicateIds).toEqual([]);
  });

  it("gives every game plan an effect to print below its name", () => {
    const withoutEffect = gamePlansData
      .filter((gamePlan) => gamePlan.effect.trim().length === 0)
      .map((gamePlan) => gamePlan.id);

    expect(withoutEffect).toEqual([]);
  });
});
