// @vitest-environment happy-dom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/browser/listAvailableGuilds", () => ({ listAvailableGuilds: vi.fn() }));
vi.mock("@/browser/loadGuildCatalog", () => ({ loadGuildCatalog: vi.fn() }));
vi.mock("@/browser/downloadBlob", () => ({ downloadBlob: vi.fn() }));

const { listAvailableGuilds } = await import("@/browser/listAvailableGuilds");
const { loadGuildCatalog } = await import("@/browser/loadGuildCatalog");
const { downloadBlob } = await import("@/browser/downloadBlob");
const { useTokenGenerator } = await import("./useTokenGenerator");

import type { WorkerRequest } from "@/browser/tokenWorker";
import type { GuildCatalog } from "@/core/token/catalog/catalogTypes";
import { DEFAULT_TOKEN_TUNING } from "@/core/token/catalog/tokenItems/defaultSharedConfig";
import { DEFAULT_ARC_SHAPE } from "@/core/token/defaultShapeAndStyle";

import { FakeWorker, installFakeWorker, lastPostedRequest } from "./fakeWorker";
import { LIVE_PREVIEW_DEBOUNCE_MS } from "./livePreviewDebounce";

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
  genericTokens: [{ name: "Beer Token" }],
  conditions: [],
  appliedConditionIds: [],
  gamePlans: [],
};

beforeEach(() => {
  installFakeWorker();
  vi.mocked(listAvailableGuilds)
    .mockReset()
    .mockReturnValue([{ id: "brewers", name: "Brewers", color: "#cdb320" }]);
  vi.mocked(loadGuildCatalog).mockReset().mockReturnValue(catalog);
  vi.mocked(downloadBlob).mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useTokenGenerator", () => {
  it("loads the guild list on mount", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    await vi.waitFor(() => {
      expect(result.current.guilds).toEqual([{ id: "brewers", name: "Brewers", color: "#cdb320" }]);
    });
  });

  it("does not select a guild before the user picks one", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    await vi.waitFor(() => {
      expect(result.current.guilds).toEqual([{ id: "brewers", name: "Brewers", color: "#cdb320" }]);
    });

    expect(result.current.selectedGuildId).toBeUndefined();
    expect(loadGuildCatalog).not.toHaveBeenCalled();
  });

  it("selects a guild, loads its catalog, and defaults the selection to everything enabled", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    expect(loadGuildCatalog).toHaveBeenCalledWith("brewers");
    expect(result.current.catalog).toEqual(catalog);
    expect(result.current.selection.characterTokenIds).toEqual(["Tapper-0", "Tapper-1"]);
    expect(result.current.selection.characterTokenCopies).toEqual({});
    expect(result.current.selection.genericTokens).toEqual({
      "Beer Token": { enabled: true, copies: 1 },
    });
    expect(result.current.selection.influence).toEqual({ enabled: true, copies: 13 });
    expect(result.current.selection.momentum).toEqual({ enabled: true, copies: 15 });
    expect(result.current.selection.goalInfluence).toEqual({ enabled: true, copies: 2 });
    expect(result.current.sharedConfig.influenceIconId).toBe("Brewers");
  });

  it("does not loop the preview after the worker responds for an untouched guild", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    const worker = FakeWorker.instances[0];

    // Selecting a guild triggers two legitimate, one-time recomputes in quick succession: the
    // default selection's own preview (fired immediately, leading edge), then a second one once
    // the guild's own colors land in sharedConfig a moment later (which the debounce coalesces
    // into a single trailing call). Settle both before probing for a loop, so this test isn't
    // confused by that expected, non-looping double-fire.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LIVE_PREVIEW_DEBOUNCE_MS);
    });

    const settledCallCount = worker.postMessage.mock.calls.length;
    const request = lastPostedRequest(worker);

    if (request.kind !== "preview") {
      throw new Error("expected a preview request");
    }

    await act(async () => {
      worker.emit({
        kind: "preview",
        requestId: request.requestId,
        results: [],
        validCount: 0,
        invalidCount: request.items.length,
      });
    });

    // Regression: `selection` for an untouched guild used to be rebuilt from scratch on every
    // render instead of staying referentially stable, so the response above -- which re-renders
    // the hook -- looked like a brand new selection change and re-triggered the preview forever.
    expect(result.current.isPreviewing).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(result.current.isPreviewing).toBe(false);
    expect(worker.postMessage).toHaveBeenCalledTimes(settledCallCount);
  });

  it("remembers a guild's selection when switching away and back to it", async () => {
    const otherCatalog: GuildCatalog = {
      guildId: "cooks",
      name: "Cooks",
      color: "#eb2629",
      characters: [{ name: "Wellington", effects: ["singledOut"] }],
      genericTokens: [],
      conditions: [],
      appliedConditionIds: [],
      gamePlans: [],
    };

    vi.mocked(listAvailableGuilds).mockReturnValue([
      { id: "brewers", name: "Brewers", color: "#cdb320" },
      { id: "cooks", name: "Cooks", color: "#eb2629" },
    ]);

    // Looked up by id like the real lookup, since the hook resolves the catalog on every render.
    vi.mocked(loadGuildCatalog).mockImplementation((guildId) => {
      return guildId === otherCatalog.guildId ? otherCatalog : catalog;
    });

    const { result } = renderHook(() => useTokenGenerator());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    // Deselect one character token and disable Momentum for Brewers.
    act(() => {
      result.current.setSelection((selection) => ({
        ...selection,
        characterTokenIds: selection.characterTokenIds.filter((id) => id !== "Tapper-1"),
        momentum: { ...selection.momentum, enabled: false },
      }));
    });

    expect(result.current.selection.characterTokenIds).toEqual(["Tapper-0"]);
    expect(result.current.selection.momentum.enabled).toBe(false);

    await act(async () => {
      result.current.selectGuild("cooks");
    });

    await vi.waitFor(() => {
      expect(result.current.catalog).toEqual(otherCatalog);
    });

    // Cooks is visited for the first time, so it gets the full default selection.
    expect(result.current.selection.characterTokenIds).toEqual(["Wellington-0"]);
    expect(result.current.selection.momentum.enabled).toBe(true);

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalog).toEqual(catalog);
    });

    // Brewers' earlier edits are still there instead of being reset back to defaults.
    expect(result.current.selection.characterTokenIds).toEqual(["Tapper-0"]);
    expect(result.current.selection.momentum.enabled).toBe(false);
  });

  it("seeds the body and text colors from the guild's own color on selection", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    // Brewers' relative luminance (~0.45) is above the ~0.2 threshold, so the derived text
    // color goes dark for contrast against the guild's own bright base color.
    expect(result.current.sharedConfig.colorGroups).toEqual([
      { id: "base", name: "Body", color: "#cdb320" },
      { id: "text", name: "Details", color: "#000000" },
    ]);
  });

  it("sends a debounced preview request and applies the worker's response", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    act(() => {
      result.current.setSelection({ ...result.current.selection, characterTokenIds: ["Tapper-0"] });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const worker = FakeWorker.instances[0];
    const request = lastPostedRequest(worker);

    expect(request.kind).toBe("preview");

    await act(async () => {
      worker.emit({
        kind: "preview",
        requestId: request.requestId,
        results: [
          {
            id: "Tapper-0",
            label: "Tapper: Commanding Aura",
            group: "Tapper",
            name: "Commanding Aura",
            shape: { type: "disc", diameterMm: 10 },
            baseContours: [],
            reliefComponents: [],
            warnings: [],
            copies: 1,
            valid: true,
            reason: "",
          },
        ],
        validCount: 1,
        invalidCount: 0,
      });
    });

    expect(result.current.previewItems).toHaveLength(1);
    expect(result.current.validCount).toBe(1);
    expect(result.current.isPreviewing).toBe(false);
  });

  it("lists only the invalid preview items, grouped by character", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    act(() => {
      result.current.setSelection({ ...result.current.selection, characterTokenIds: ["Tapper-0"] });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const worker = FakeWorker.instances[0];
    const request = lastPostedRequest(worker);

    if (request.kind !== "preview") {
      throw new Error("expected a preview request");
    }

    await act(async () => {
      worker.emit({
        kind: "preview",
        requestId: request.requestId,
        results: [
          {
            id: "Tapper-0",
            label: "Tapper: Commanding Aura",
            group: "Tapper",
            name: "Commanding Aura",
            shape: { type: "disc", diameterMm: 10 },
            baseContours: [],
            reliefComponents: [],
            warnings: [],
            copies: 1,
            valid: true,
            reason: "",
          },
          {
            id: "Tapper-1",
            label: "Tapper: Marked Target",
            group: "Tapper",
            name: "Marked Target",
            shape: { type: "disc", diameterMm: 10 },
            baseContours: [],
            reliefComponents: [],
            warnings: [],
            copies: 1,
            valid: false,
            reason: "1 of 3 details (text or icon) too thin to print at this size.",
          },
        ],
        validCount: 1,
        invalidCount: 1,
      });
    });

    expect(result.current.invalidPreviewItems).toEqual([
      {
        id: "Tapper-1",
        group: "Tapper",
        name: "Marked Target",
        reason: "1 of 3 details (text or icon) too thin to print at this size.",
      },
    ]);
  });

  it("downloads a .3mf file named after the guild when the export succeeds", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    act(() => {
      result.current.setSelection({ ...result.current.selection, characterTokenIds: ["Tapper-0"] });
    });

    const exportPromise = act(async () => {
      await result.current.exportThreeMf();
    });

    await vi.waitFor(() => {
      const worker = FakeWorker.instances[0];
      const calls = worker.postMessage.mock.calls;

      expect(calls.some((call) => (call[0] as WorkerRequest).kind === "export")).toBe(true);
    });

    const worker = FakeWorker.instances[0];
    const exportRequest = worker.postMessage.mock.calls
      .map((call) => call[0] as WorkerRequest)
      .find((call) => call.kind === "export");

    if (!exportRequest) {
      throw new Error("expected an export request to have been posted");
    }

    worker.emit({
      kind: "export",
      requestId: exportRequest.requestId,
      status: "ok",
      archive: new Uint8Array([1, 2, 3]),
    });

    await exportPromise;

    expect(downloadBlob).toHaveBeenCalledWith(
      new Uint8Array([1, 2, 3]),
      "Brewers.3mf",
      "model/3mf",
    );
    expect(result.current.isExporting).toBe(false);
    expect(result.current.exportFailures).toEqual([]);
  });

  it("records failures instead of downloading when the export fails validation", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    act(() => {
      result.current.setSelection({ ...result.current.selection, characterTokenIds: ["Tapper-0"] });
    });

    const exportPromise = act(async () => {
      await result.current.exportThreeMf();
    });

    await vi.waitFor(() => {
      const worker = FakeWorker.instances[0];

      expect(
        worker.postMessage.mock.calls.some((call) => (call[0] as WorkerRequest).kind === "export"),
      ).toBe(true);
    });

    const worker = FakeWorker.instances[0];
    const exportRequest = worker.postMessage.mock.calls
      .map((call) => call[0] as WorkerRequest)
      .find((call) => call.kind === "export");

    if (!exportRequest) {
      throw new Error("expected an export request to have been posted");
    }

    worker.emit({
      kind: "export",
      requestId: exportRequest.requestId,
      status: "failed",
      failures: [{ id: "Tapper-0", label: "Tapper: Commanding Aura", reason: "Invalid mesh." }],
    });

    await exportPromise;

    expect(downloadBlob).not.toHaveBeenCalled();
    expect(result.current.exportFailures).toEqual([
      { id: "Tapper-0", label: "Tapper: Commanding Aura", reason: "Invalid mesh." },
    ]);
  });

  it("downloads the shared config as a settings JSON file", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    act(() => {
      result.current.exportSettingsJson();
    });

    expect(downloadBlob).toHaveBeenCalledWith(
      JSON.stringify(result.current.sharedConfig, null, 2),
      "token-settings.json",
      "application/json",
    );
  });

  it("applies an imported settings file to the shared config", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    const importedConfig = {
      arcShape: { type: "arc", ribbonWidthMm: 20, ribbonLengthMm: 25, studDiameterMm: 30 },
      discShape: { type: "disc", diameterMm: 30 },
      goalInfluenceShape: { type: "disc", diameterMm: 24 },
      style: { relief: "engraved", reliefHeightMm: 0.8, baseThicknessMm: 4 },
      fitPolicy: { minTracking: 0, maxTracking: 0.2, minScale: 0.6, allowTwoLines: false },
      printProfileId: "fdm-04",
      colorGroups: [{ id: "base", name: "Body", color: "#123456" }],
      influenceIconId: "blank",
      nameSizeMm: 5,
      effectSizeMm: 3,
      showSecondLine: false,
      balanceTwoLineSizes: true,
      iconOverflowBehavior: "trim",
      aoeTemplateVariant: "compactDisc",
    };
    const file = new File([JSON.stringify(importedConfig)], "settings.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current.importSettingsJson(file);
    });

    expect(result.current.sharedConfig).toEqual({
      ...DEFAULT_TOKEN_TUNING,
      ...importedConfig,
      arcShape: {
        ...importedConfig.arcShape,
        studFilletEnabled: DEFAULT_ARC_SHAPE.studFilletEnabled,
        studFilletRadiusMm: DEFAULT_ARC_SHAPE.studFilletRadiusMm,
      },
    });
    expect(result.current.importSettingsError).toBeUndefined();
  });

  it("defaults the options added later when importing a settings file exported before they existed", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    const importedConfig = {
      arcShape: { type: "arc", ribbonWidthMm: 20, ribbonLengthMm: 25, studDiameterMm: 30 },
      discShape: { type: "disc", diameterMm: 30 },
      goalInfluenceShape: { type: "disc", diameterMm: 24 },
      style: { relief: "engraved", reliefHeightMm: 0.8, baseThicknessMm: 4 },
      fitPolicy: { minTracking: 0, maxTracking: 0.2, minScale: 0.6, allowTwoLines: false },
      printProfileId: "fdm-04",
      colorGroups: [{ id: "base", name: "Body", color: "#123456" }],
      influenceIconId: "blank",
      nameSizeMm: 5,
      effectSizeMm: 3,
      showSecondLine: false,
      balanceTwoLineSizes: true,
      // iconOverflowBehavior and aoeTemplateVariant intentionally absent, as in a file exported
      // before they existed.
    };
    const file = new File([JSON.stringify(importedConfig)], "settings.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current.importSettingsJson(file);
    });

    expect(result.current.sharedConfig).toEqual({
      ...DEFAULT_TOKEN_TUNING,
      ...importedConfig,
      arcShape: {
        ...importedConfig.arcShape,
        studFilletEnabled: DEFAULT_ARC_SHAPE.studFilletEnabled,
        studFilletRadiusMm: DEFAULT_ARC_SHAPE.studFilletRadiusMm,
      },
      iconOverflowBehavior: "none",
      aoeTemplateVariant: "ring",
    });
    expect(result.current.importSettingsError).toBeUndefined();
  });

  it("reports an error and keeps the current config when the imported file is invalid", async () => {
    const { result } = renderHook(() => useTokenGenerator());
    const originalConfig = result.current.sharedConfig;
    const file = new File(["{}"], "settings.json", { type: "application/json" });

    await act(async () => {
      await result.current.importSettingsJson(file);
    });

    expect(result.current.importSettingsError).toBe("This file is not a valid settings file.");
    expect(result.current.sharedConfig).toEqual(originalConfig);
  });
});
