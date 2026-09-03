import { describe, expect, it } from "vitest";

import { loadGuildCatalog } from "./loadGuildCatalog";

describe("loadGuildCatalog", () => {
  it("loads the bundled catalog for the given guild id", async () => {
    const result = await loadGuildCatalog("brewers");

    expect(result.guildId).toBe("brewers");
    expect(result.name).toBe("Brewers");
  });

  it("throws when no catalog file exists for the guild id", async () => {
    await expect(loadGuildCatalog("no-such-guild")).rejects.toThrow(
      'Failed to load catalog for guild "no-such-guild"',
    );
  });
});
