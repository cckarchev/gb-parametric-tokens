import { describe, expect, it } from "vitest";

import { resolveCharacter } from "./characters";

describe("resolveCharacter", () => {
  it("resolves a known character from the bundled catalog", () => {
    expect(resolveCharacter("Shank")).toEqual({
      name: "Shank",
      effects: ["thousandCuts"],
    });
  });

  it("throws for an unknown character name", () => {
    expect(() => resolveCharacter("Not A Real Character")).toThrow(
      'Unknown character "Not A Real Character"',
    );
  });
});
