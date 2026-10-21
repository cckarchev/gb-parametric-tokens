// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GuildCatalog } from "@/core/token/catalog/catalogTypes";
import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/token-items/defaultSharedConfig";
import type {
  SharedConfig,
  TokenSelection,
} from "@/core/token/catalog/token-items/tokenItem";

import { FakeWorker, installFakeWorker, lastPostedRequest } from "./fakeWorker";
import { LIVE_PREVIEW_DEBOUNCE_MS } from "./livePreviewDebounce";
import { usePreview } from "./usePreview";

const catalog: GuildCatalog = {
  guildId: "brewers",
  name: "Brewers",
  color: "#cdb320",
  characters: [
    {
      name: "Tapper",
      effects: ["commandingAura", "markedTarget"],
    },
  ],
  genericTokens: [],
  conditions: [],
  appliedConditionIds: [],
  gamePlans: [],
};

const sharedConfig: SharedConfig = {
  ...DEFAULT_SHARED_CONFIG,
  arcShape: {
    type: "arc",
    ribbonWidthMm: 15,
    ribbonLengthMm: 20,
    studDiameterMm: 24,
  },
  discShape: { type: "disc", diameterMm: 25 },
  fitPolicy: {
    minTracking: 0,
    maxTracking: 0.3,
    minScale: 0.7,
    allowTwoLines: true,
  },
  printProfileId: "fdm-04",
  influenceIconId: "Brewers",
  nameSizeMm: 6,
  effectSizeMm: 4,
};

const baseSelection: TokenSelection = {
  characterTokenIds: [],
  characterTokenCopies: {},
  genericTokens: {},
  influence: { enabled: false, copies: 1 },
  momentum: { enabled: false, copies: 1 },
  goalInfluence: { enabled: false, copies: 1 },
  conditions: {},
  gamePlans: {},
};

const selectionWith = (characterTokenIds: string[]): TokenSelection => ({
  ...baseSelection,
  characterTokenIds,
});

beforeEach(() => {
  installFakeWorker();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("usePreview debounce", () => {
  it("fires an isolated change immediately instead of waiting out the debounce window", () => {
    const { rerender } = renderHook(
      ({ selection }) => usePreview(catalog, selection, sharedConfig),
      { initialProps: { selection: baseSelection } },
    );

    const worker = FakeWorker.instances[0];

    rerender({ selection: selectionWith(["Tapper-0"]) });

    // No vi.advanceTimersByTime here: a change with nothing recent before it should not need to
    // wait out the debounce window at all.
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    expect(lastPostedRequest(worker).kind).toBe("preview");
  });

  it("coalesces a rapid burst of changes into a single trailing call", () => {
    const { rerender } = renderHook(
      ({ selection }) => usePreview(catalog, selection, sharedConfig),
      { initialProps: { selection: baseSelection } },
    );

    const worker = FakeWorker.instances[0];

    // First change of the burst: fires immediately (leading edge).
    rerender({ selection: selectionWith(["Tapper-0"]) });
    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    // Second change arrives right after, still inside the debounce window: must not fire yet.
    rerender({ selection: selectionWith(["Tapper-0", "Tapper-1"]) });
    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(LIVE_PREVIEW_DEBOUNCE_MS - 1);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(worker.postMessage).toHaveBeenCalledTimes(2);

    const request = lastPostedRequest(worker);
    if (request.kind !== "preview") {
      throw new Error("expected a preview request");
    }
    expect(request.items.map((item) => item.id)).toEqual([
      "Tapper-0",
      "Tapper-1",
    ]);
  });

  it("fires immediately again once the debounce window has fully elapsed", () => {
    const { rerender } = renderHook(
      ({ selection }) => usePreview(catalog, selection, sharedConfig),
      { initialProps: { selection: baseSelection } },
    );

    const worker = FakeWorker.instances[0];

    rerender({ selection: selectionWith(["Tapper-0"]) });
    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(LIVE_PREVIEW_DEBOUNCE_MS);

    rerender({ selection: selectionWith(["Tapper-1"]) });
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
  });

  it("clears isPreviewing when the selection empties out instead of leaving it stuck", () => {
    const { result, rerender } = renderHook(
      ({ selection }) => usePreview(catalog, selection, sharedConfig),
      { initialProps: { selection: baseSelection } },
    );

    rerender({ selection: selectionWith(["Tapper-0"]) });
    expect(result.current.isPreviewing).toBe(true);

    rerender({ selection: baseSelection });
    expect(result.current.isPreviewing).toBe(false);
  });

  it("clears isPreviewing when the worker itself fails instead of leaving it stuck", () => {
    const { result, rerender } = renderHook(
      ({ selection }) => usePreview(catalog, selection, sharedConfig),
      { initialProps: { selection: baseSelection } },
    );

    rerender({ selection: selectionWith(["Tapper-0"]) });
    expect(result.current.isPreviewing).toBe(true);

    act(() => {
      FakeWorker.instances[0].fail("Failed to fetch the worker script");
    });

    expect(result.current.isPreviewing).toBe(false);
  });
});
