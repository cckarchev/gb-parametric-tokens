// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useGuildCatalog } from "./useGuildCatalog";

const goBack = () => {
  window.history.back();
  window.dispatchEvent(new PopStateEvent("popstate"));
};

describe("useGuildCatalog routing", () => {
  it("starts with no guild at the root path", () => {
    const { result } = renderHook(() => useGuildCatalog());

    expect(result.current.selectedGuildId).toBeUndefined();
    expect(result.current.catalogStatus).toBe("idle");
  });

  it("navigates to /guild/<id> when a guild is selected", () => {
    const { result } = renderHook(() => useGuildCatalog());

    act(() => {
      result.current.selectGuild("brewers");
    });

    expect(window.location.pathname).toBe("/guild/brewers");
    expect(result.current.selectedGuildId).toBe("brewers");
    expect(result.current.catalog?.name).toBe("Brewers");
  });

  it("opens the guild named in the URL on first render", () => {
    window.history.replaceState(null, "", "/guild/farmers");

    const { result } = renderHook(() => useGuildCatalog());

    expect(result.current.selectedGuildId).toBe("farmers");
    expect(result.current.catalogStatus).toBe("ready");
  });

  it("opens the generic catalog from its own route and navigates back to it", () => {
    window.history.replaceState(null, "", "/generic");

    const { result } = renderHook(() => useGuildCatalog());

    expect(result.current.selectedGuildId).toBe("generic");
    expect(result.current.catalog?.name).toBe("Generic");

    act(() => {
      result.current.selectGuild("brewers");
    });

    act(() => {
      result.current.selectGuild("generic");
    });

    expect(window.location.pathname).toBe("/generic");
  });

  it("rewrites an unknown guild route to the root and opens no guild", () => {
    window.history.replaceState(null, "", "/guild/not-a-guild");

    const { result } = renderHook(() => useGuildCatalog());

    expect(window.location.pathname).toBe("/");
    expect(result.current.selectedGuildId).toBeUndefined();
  });
});

describe("useGuildCatalog history", () => {
  it("follows the back button to the previous guild and then to no guild", async () => {
    const { result } = renderHook(() => useGuildCatalog());

    act(() => {
      result.current.selectGuild("brewers");
    });

    act(() => {
      result.current.selectGuild("farmers");
    });

    await act(async () => {
      goBack();
    });

    expect(window.location.pathname).toBe("/guild/brewers");
    expect(result.current.selectedGuildId).toBe("brewers");

    await act(async () => {
      goBack();
    });

    expect(window.location.pathname).toBe("/");
    expect(result.current.selectedGuildId).toBeUndefined();
  });

  it("does not push a duplicate history entry when the open guild is picked again", () => {
    const { result } = renderHook(() => useGuildCatalog());

    act(() => {
      result.current.selectGuild("brewers");
    });

    const historyLength = window.history.length;

    act(() => {
      result.current.selectGuild("brewers");
    });

    expect(window.history.length).toBe(historyLength);
  });
});
