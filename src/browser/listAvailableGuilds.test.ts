import { afterEach, describe, expect, it, vi } from "vitest";

import { listAvailableGuilds } from "./listAvailableGuilds";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listAvailableGuilds", () => {
  it("fetches the guild index", async () => {
    const guilds = [{ id: "brewers", name: "Brewers" }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(guilds),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await listAvailableGuilds();

    expect(fetchMock).toHaveBeenCalledWith("/catalog/index.json");
    expect(result).toEqual(guilds);
  });

  it("throws when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, statusText: "Internal Server Error" });

    vi.stubGlobal("fetch", fetchMock);

    await expect(listAvailableGuilds()).rejects.toThrow(
      "Failed to load guild index: Internal Server Error",
    );
  });
});
