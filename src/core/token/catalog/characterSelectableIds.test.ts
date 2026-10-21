import { describe, expect, it } from "vitest";

import { characterSelectableIds } from "./characterSelectableIds";

describe("characterSelectableIds", () => {
  it("lists token ids, then AOE template ids with their own prefix", () => {
    const character = {
      name: "Smoke",
      effects: ["unpredictableMovementUsed", "fulmination"],
      aoeTemplates: ["smokeBomb"],
    };

    expect(characterSelectableIds(character)).toEqual([
      "Smoke-0",
      "Smoke-1",
      "Smoke-aoe-0",
    ]);
  });

  it("lists only token ids for a character without templates", () => {
    expect(
      characterSelectableIds({ name: "Tapper", effects: ["commandingAura"] }),
    ).toEqual(["Tapper-0"]);
  });
});
