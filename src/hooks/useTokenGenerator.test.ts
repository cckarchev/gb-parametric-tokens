// @vitest-environment happy-dom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../browser/listAvailableGuilds", () => ({ listAvailableGuilds: vi.fn() }));
vi.mock("../browser/loadGuildCatalog", () => ({ loadGuildCatalog: vi.fn() }));
vi.mock("../browser/downloadBlob", () => ({ downloadBlob: vi.fn() }));

const { listAvailableGuilds } = await import("../browser/listAvailableGuilds");
const { loadGuildCatalog } = await import("../browser/loadGuildCatalog");
const { downloadBlob } = await import("../browser/downloadBlob");
const { useTokenGenerator } = await import("./useTokenGenerator");

import type { ExportResponse, PreviewResponse, WorkerRequest } from "../browser/tokenWorker";
import type { GuildCatalog } from "../core/token/catalog/catalogTypes";

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    FakeWorker.instances.push(this);
  }

  emit(data: PreviewResponse | ExportResponse) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

const catalog: GuildCatalog = {
  guildId: "brewers",
  name: "Brewers",
  color: "#cdb320",
  characters: [
    {
      id: "tapper",
      name: "Tapper",
      tokens: [{ title: "Commanding Aura" }, { title: "Marked Target" }],
    },
  ],
  genericTokens: [{ id: "beer-token", name: "Beer Token" }],
};

const lastPostedRequest = (worker: FakeWorker): WorkerRequest => {
  const calls = worker.postMessage.mock.calls;

  return calls[calls.length - 1][0] as WorkerRequest;
};

beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
  vi.mocked(listAvailableGuilds)
    .mockReset()
    .mockResolvedValue([{ id: "brewers", name: "Brewers", color: "#cdb320" }]);
  vi.mocked(loadGuildCatalog).mockReset().mockResolvedValue(catalog);
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

  it("selects a guild, loads its catalog, and defaults the selection to nothing", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    expect(loadGuildCatalog).toHaveBeenCalledWith("brewers");
    expect(result.current.catalog).toEqual(catalog);
    expect(result.current.selection.characterTokenIds).toEqual([]);
    expect(result.current.selection.characterTokenCopies).toEqual({});
    expect(result.current.selection.genericTokens).toEqual({});
    expect(result.current.selection.influence).toEqual({ enabled: false, copies: 13 });
    expect(result.current.selection.momentum).toEqual({ enabled: false, copies: 15 });
    expect(result.current.selection.goalInfluence).toEqual({ enabled: false, copies: 2 });
    expect(result.current.sharedConfig.influenceIconId).toBe("Brewers");
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
      { id: "text", name: "Text & symbols", color: "#000000" },
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
      result.current.setSelection({ ...result.current.selection, characterTokenIds: ["tapper-0"] });
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
            id: "tapper-0",
            label: "Tapper: Commanding Aura",
            shape: { type: "disc", diameterMm: 10 },
            baseContours: [],
            reliefComponents: [],
            warnings: [],
            copies: 1,
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

  it("downloads a .3mf file named after the guild when the export succeeds", async () => {
    const { result } = renderHook(() => useTokenGenerator());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    act(() => {
      result.current.setSelection({ ...result.current.selection, characterTokenIds: ["tapper-0"] });
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
      result.current.setSelection({ ...result.current.selection, characterTokenIds: ["tapper-0"] });
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
      failures: [{ id: "tapper-0", label: "Tapper: Commanding Aura", reason: "Invalid mesh." }],
    });

    await exportPromise;

    expect(downloadBlob).not.toHaveBeenCalled();
    expect(result.current.exportFailures).toEqual([
      { id: "tapper-0", label: "Tapper: Commanding Aura", reason: "Invalid mesh." },
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
      arcShape: { type: "arc", ribbonWidthMm: 20, ribbonLengthMm: 25, nobDiameterMm: 30 },
      discShape: { type: "disc", diameterMm: 30 },
      goalInfluenceShape: { type: "disc", diameterMm: 24 },
      style: { relief: "engraved", reliefHeightMm: 0.8, baseThicknessMm: 4 },
      fitPolicy: { minTracking: 0, maxTracking: 0.2, minScale: 0.6, allowTwoLines: false },
      printProfileId: "fdm-04",
      colorGroups: [{ id: "base", name: "Body", color: "#123456" }],
      influenceIconId: "blank",
      titleSizeMm: 5,
      subtitleSizeMm: 3,
    };
    const file = new File([JSON.stringify(importedConfig)], "settings.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current.importSettingsJson(file);
    });

    expect(result.current.sharedConfig).toEqual(importedConfig);
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
