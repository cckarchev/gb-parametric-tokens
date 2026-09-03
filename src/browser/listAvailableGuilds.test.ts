import { describe, expect, it } from "vitest";

import { listAvailableGuilds } from "./listAvailableGuilds";

describe("listAvailableGuilds", () => {
  it("lists the bundled guild index", async () => {
    const result = await listAvailableGuilds();

    expect(result).toContainEqual({ id: "brewers", name: "Brewers" });
  });
});
