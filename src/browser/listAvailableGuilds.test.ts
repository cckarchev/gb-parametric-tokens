import { describe, expect, it } from "vitest";

import { listAvailableGuilds } from "./listAvailableGuilds";

describe("listAvailableGuilds", () => {
  it("lists the bundled guild index", async () => {
    const result = await listAvailableGuilds();

    expect(result).toContainEqual(
      expect.objectContaining({ id: "brewers", name: "Brewers", color: "#cdb320" }),
    );
  });

  it("exposes a guild's iconScale from its own catalog file", async () => {
    const result = await listAvailableGuilds();

    expect(result).toContainEqual(expect.objectContaining({ id: "falconers", iconScale: 1.45 }));
  });

  it("leaves iconScale undefined for a guild whose catalog doesn't set one", async () => {
    const result = await listAvailableGuilds();

    expect(result.find((guild) => guild.id === "brewers")?.iconScale).toBeUndefined();
  });
});
