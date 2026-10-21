import { describe, expect, it } from "vitest";

import { GENERIC_CATALOG_ID } from "@/core/token/catalog/genericCatalog";

import { listAvailableGuilds } from "./listAvailableGuilds";

describe("listAvailableGuilds", () => {
  it("lists the bundled guild index", () => {
    const result = listAvailableGuilds();

    expect(result).toContainEqual(
      expect.objectContaining({
        id: "brewers",
        name: "Brewers",
        color: "#cdb320",
      }),
    );
  });

  it("lists the generic catalog last, after every guild", () => {
    const result = listAvailableGuilds();
    const lastEntry = result[result.length - 1];

    expect(lastEntry).toEqual(
      expect.objectContaining({ id: GENERIC_CATALOG_ID, name: "Generic" }),
    );
  });

  it("exposes a guild's iconScale from its own catalog file", () => {
    const result = listAvailableGuilds();

    expect(result).toContainEqual(
      expect.objectContaining({ id: "falconers", iconScale: 1.45 }),
    );
  });

  it("leaves iconScale undefined for a guild whose catalog doesn't set one", () => {
    const result = listAvailableGuilds();

    expect(
      result.find((guild) => guild.id === "brewers")?.iconScale,
    ).toBeUndefined();
  });
});
