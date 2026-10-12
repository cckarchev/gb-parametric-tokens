import { describe, expect, it } from "vitest";

import { buildDefaultSelection } from "./buildDefaultSelection";
import { GuildCatalog } from "./catalogTypes";

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

  it("selects nothing for a catalog with no characters or generic tokens", () => {
    const emptyCatalog: GuildCatalog = {
      guildId: "empty",
      name: "Empty",
      color: "#000000",
      characters: [],
      genericTokens: [],
    };

    const selection = buildDefaultSelection(emptyCatalog);

    expect(selection.characterTokenIds).toEqual([]);
    expect(selection.genericTokens).toEqual({});
  });
});
