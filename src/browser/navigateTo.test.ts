// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";

import { navigateTo } from "./navigateTo";

describe("navigateTo", () => {
  it("pushes the new path and announces it the way back/forward would", () => {
    window.history.replaceState(null, "", "/guild/brewers");
    const onPopState = vi.fn();

    window.addEventListener("popstate", onPopState);
    navigateTo("/");
    window.removeEventListener("popstate", onPopState);

    expect(window.location.pathname).toBe("/");
    expect(onPopState).toHaveBeenCalledTimes(1);
  });

  it("does not push a duplicate history entry for the current path", () => {
    window.history.replaceState(null, "", "/");
    const historyLength = window.history.length;

    navigateTo("/");

    expect(window.history.length).toBe(historyLength);
  });
});
