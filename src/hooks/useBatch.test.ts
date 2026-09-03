// @vitest-environment happy-dom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../browser/listAvailableGuilds", () => ({ listAvailableGuilds: vi.fn() }));
vi.mock("../browser/loadGuildCatalog", () => ({ loadGuildCatalog: vi.fn() }));
vi.mock("../browser/downloadBlob", () => ({ downloadBlob: vi.fn() }));

const { listAvailableGuilds } = await import("../browser/listAvailableGuilds");
const { loadGuildCatalog } = await import("../browser/loadGuildCatalog");
const { downloadBlob } = await import("../browser/downloadBlob");
const { useBatch } = await import("./useBatch");

import type {
  BatchExportResponse,
  BatchPreviewResponse,
  BatchWorkerRequest,
} from "../browser/batchWorker";
import type { GuildCatalog } from "../core/token/catalog/catalogTypes";

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    FakeWorker.instances.push(this);
  }

  emit(data: BatchPreviewResponse | BatchExportResponse) {
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
      tokens: [{ line1: "Commanding Aura" }, { line1: "Marked Target" }],
    },
  ],
  genericTokens: [{ id: "beer-token", name: "Beer Token" }],
};

const lastPostedRequest = (worker: FakeWorker): BatchWorkerRequest => {
  const calls = worker.postMessage.mock.calls;

  return calls[calls.length - 1][0] as BatchWorkerRequest;
};

beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
  vi.mocked(listAvailableGuilds)
    .mockReset()
    .mockResolvedValue([{ id: "brewers", name: "Brewers" }]);
  vi.mocked(loadGuildCatalog).mockReset().mockResolvedValue(catalog);
  vi.mocked(downloadBlob).mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useBatch", () => {
  it("loads the guild list on mount", async () => {
    const { result } = renderHook(() => useBatch());

    await vi.waitFor(() => {
      expect(result.current.guilds).toEqual([{ id: "brewers", name: "Brewers" }]);
    });
  });

  // TEMPORARY: Brewers auto-selects on mount so the batch flow has something loaded on open,
  // until there's a real guild picker / persisted last-selected-guild. See useBatch.ts's
  // TEMPORARY_DEFAULT_GUILD_ID.
  it("auto-selects Brewers as a temporary default once the guild list loads", async () => {
    const { result } = renderHook(() => useBatch());

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    expect(result.current.selectedGuildId).toBe("brewers");
    expect(loadGuildCatalog).toHaveBeenCalledWith("brewers");
  });

  it("does not auto-select a guild when Brewers is not in the loaded guild list", async () => {
    vi.mocked(listAvailableGuilds).mockResolvedValue([{ id: "other-guild", name: "Other Guild" }]);

    const { result } = renderHook(() => useBatch());

    await vi.waitFor(() => {
      expect(result.current.guilds).toEqual([{ id: "other-guild", name: "Other Guild" }]);
    });

    expect(result.current.selectedGuildId).toBeUndefined();
    expect(loadGuildCatalog).not.toHaveBeenCalled();
  });

  it("selects a guild, loads its catalog, and defaults the selection to every character token", async () => {
    const { result } = renderHook(() => useBatch());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    expect(loadGuildCatalog).toHaveBeenCalledWith("brewers");
    expect(result.current.catalog).toEqual(catalog);
    expect(result.current.selection.characterTokenIds).toEqual(["tapper-0", "tapper-1"]);
    expect(result.current.sharedConfig.influenceIconId).toBe("Brewers");
  });

  it("seeds the body and text colors from the guild's own color on selection", async () => {
    const { result } = renderHook(() => useBatch());

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
    const { result } = renderHook(() => useBatch());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
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

  it("downloads a zip archive when the export succeeds", async () => {
    const { result } = renderHook(() => useBatch());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    const exportPromise = act(async () => {
      await result.current.exportZip();
    });

    await vi.waitFor(() => {
      const worker = FakeWorker.instances[0];
      const calls = worker.postMessage.mock.calls;

      expect(calls.some((call) => (call[0] as BatchWorkerRequest).kind === "export")).toBe(true);
    });

    const worker = FakeWorker.instances[0];
    const exportRequest = worker.postMessage.mock.calls
      .map((call) => call[0] as BatchWorkerRequest)
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

    expect(downloadBlob).toHaveBeenCalledOnce();
    expect(result.current.isExporting).toBe(false);
    expect(result.current.exportFailures).toEqual([]);
  });

  it("records failures instead of downloading when the export fails validation", async () => {
    const { result } = renderHook(() => useBatch());

    await act(async () => {
      result.current.selectGuild("brewers");
    });

    await vi.waitFor(() => {
      expect(result.current.catalogStatus).toBe("ready");
    });

    const exportPromise = act(async () => {
      await result.current.exportZip();
    });

    await vi.waitFor(() => {
      const worker = FakeWorker.instances[0];

      expect(
        worker.postMessage.mock.calls.some(
          (call) => (call[0] as BatchWorkerRequest).kind === "export",
        ),
      ).toBe(true);
    });

    const worker = FakeWorker.instances[0];
    const exportRequest = worker.postMessage.mock.calls
      .map((call) => call[0] as BatchWorkerRequest)
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
});
