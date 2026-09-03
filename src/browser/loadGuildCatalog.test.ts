import { afterEach, describe, expect, it, vi } from "vitest";

import { loadGuildCatalog } from "./loadGuildCatalog";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadGuildCatalog", () => {
  it("fetches the catalog JSON for the given guild id", async () => {
    const catalog = { guildId: "brewers", name: "Brewers", characters: [], genericTokens: [] };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(catalog),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await loadGuildCatalog("brewers");

    expect(fetchMock).toHaveBeenCalledWith("/catalog/brewers.json");
    expect(result).toEqual(catalog);
  });

  it("throws when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, statusText: "Not Found" });

    vi.stubGlobal("fetch", fetchMock);

    await expect(loadGuildCatalog("missing-guild")).rejects.toThrow(
      'Failed to load catalog for guild "missing-guild": Not Found',
    );
  });
});
