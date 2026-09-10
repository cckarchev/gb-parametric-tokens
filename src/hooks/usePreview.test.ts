// @vitest-environment happy-dom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkerRequest } from "../browser/tokenWorker";
import { SharedConfig, TokenSelection } from "../core/token/catalog/buildTokenItems";
import { GuildCatalog } from "../core/token/catalog/catalogTypes";
import { usePreview } from "./usePreview";

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    FakeWorker.instances.push(this);
  }
}

const catalog: GuildCatalog = {
  guildId: "brewers",
  name: "Brewers",
  color: "#cdb320",
  characters: [
    {
      name: "Tapper",
      effects: ["Commanding Aura", "Marked Target"],
    },
  ],
  genericTokens: [],
};

const sharedConfig: SharedConfig = {
  arcShape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, studDiameterMm: 24 },
  discShape: { type: "disc", diameterMm: 25 },
  goalInfluenceShape: { type: "disc", diameterMm: 20 },
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
  printProfileId: "fdm-04",
  colorGroups: [{ id: "base", name: "Base", color: "#2B2B2B" }],
  influenceIconId: "Brewers",
  nameSizeMm: 6,
  effectSizeMm: 4,
  showSecondLine: true,
  balanceTwoLineSizes: false,
  iconOverflowBehavior: "none",
};

const baseSelection: TokenSelection = {
  characterTokenIds: [],
  characterTokenCopies: {},
  genericTokens: {},
  influence: { enabled: false, copies: 1 },
  momentum: { enabled: false, copies: 1 },
  goalInfluence: { enabled: false, copies: 1 },
};

const selectionWith = (characterTokenIds: string[]): TokenSelection => ({
  ...baseSelection,
  characterTokenIds,
});

const lastPostedRequest = (worker: FakeWorker): WorkerRequest => {
  const calls = worker.postMessage.mock.calls;

  return calls[calls.length - 1][0] as WorkerRequest;
};

beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
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

    vi.advanceTimersByTime(299);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(worker.postMessage).toHaveBeenCalledTimes(2);

    const request = lastPostedRequest(worker);
    if (request.kind !== "preview") {
      throw new Error("expected a preview request");
    }
    expect(request.items.map((item) => item.id)).toEqual(["Tapper-0", "Tapper-1"]);
  });

  it("fires immediately again once the debounce window has fully elapsed", () => {
    const { rerender } = renderHook(
      ({ selection }) => usePreview(catalog, selection, sharedConfig),
      { initialProps: { selection: baseSelection } },
    );

    const worker = FakeWorker.instances[0];

    rerender({ selection: selectionWith(["Tapper-0"]) });
    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);

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
});
