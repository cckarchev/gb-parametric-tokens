// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../browser/loadFont", () => ({ loadFont: vi.fn() }));
vi.mock("../browser/loadIconManifest", () => ({ loadIconManifest: vi.fn() }));
vi.mock("../browser/loadIconSource", () => ({ createLoadIconSource: vi.fn(() => vi.fn()) }));
vi.mock("../browser/downloadBlob", () => ({ downloadBlob: vi.fn() }));
vi.mock("../core/token/computeReliefComponents", () => ({ computeReliefComponents: vi.fn() }));
vi.mock("../core/token/buildTokenParts", () => ({ buildTokenParts: vi.fn() }));
vi.mock("../core/token/export/threeMfModel", () => ({
  buildThreeMfModelXml: vi.fn(() => "<model/>"),
}));
vi.mock("../core/token/export/threeMfArchive", () => ({
  buildThreeMfArchive: vi.fn(() => new Uint8Array([1])),
}));

const { loadFont } = await import("../browser/loadFont");
const { loadIconManifest } = await import("../browser/loadIconManifest");
const { downloadBlob } = await import("../browser/downloadBlob");
const { computeReliefComponents } = await import("../core/token/computeReliefComponents");
const { buildTokenParts } = await import("../core/token/buildTokenParts");
const { useTokenSpec } = await import("./useTokenSpec");

import type { Font } from "opentype.js";

import type { ManifestEntry } from "../core/token/icons/iconManifest";
import type { TokenPart } from "../core/token/mesh/tokenPart";
import type { MinStrokeWidthValidation } from "../core/token/validation/validateMinStrokeWidth";

const fakeFont = {} as Font;
const fakeManifest: ManifestEntry[] = [];

const passingValidation: MinStrokeWidthValidation = {
  valid: true,
  areaBeforeMm2: 10,
  areaAfterErosionMm2: 9,
  featureCount: 2,
  vanishedFeatureCount: 0,
};

const fakePart = (status: string): TokenPart =>
  ({ colorGroupId: "base", manifold: { status: () => status } }) as unknown as TokenPart;

beforeEach(() => {
  vi.mocked(loadFont).mockResolvedValue(fakeFont);
  vi.mocked(loadIconManifest).mockResolvedValue(fakeManifest);
  vi.mocked(computeReliefComponents).mockResolvedValue({
    reliefComponents: [],
    validation: passingValidation,
    warnings: [],
  });
  vi.mocked(buildTokenParts).mockResolvedValue([fakePart("NoError")]);
  vi.mocked(downloadBlob).mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useTokenSpec", () => {
  it("starts loading and becomes ready once font and manifest resolve", async () => {
    const { result } = renderHook(() => useTokenSpec());

    expect(result.current.status).toBe("loading");

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current.status).toBe("ready");
  });

  it("surfaces a loading error", async () => {
    vi.mocked(loadFont).mockRejectedValue(new Error("font fetch failed"));

    const { result } = renderHook(() => useTokenSpec());

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toBe("font fetch failed");
  });

  it("runs the debounced validation once resources are ready and applies the result", async () => {
    const fakeReliefComponents = [{ contours: [[[0, 0] as [number, number]]], colorGroup: "base" }];

    vi.mocked(computeReliefComponents).mockResolvedValue({
      reliefComponents: fakeReliefComponents,
      validation: passingValidation,
      warnings: [],
    });

    const { result } = renderHook(() => useTokenSpec());

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(computeReliefComponents).toHaveBeenCalled();
    expect(result.current.validation).toEqual(passingValidation);
    expect(result.current.isValidating).toBe(false);
    expect(result.current.reliefComponents).toEqual(fakeReliefComponents);
  });

  it("exports a .3mf archive when every part is valid", async () => {
    const { result } = renderHook(() => useTokenSpec());

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    await act(async () => {
      await result.current.exportThreeMf();
    });

    expect(downloadBlob).toHaveBeenCalledOnce();
    expect(result.current.exportError).toBeUndefined();
  });

  it("reports an export error instead of downloading when a part is invalid", async () => {
    vi.mocked(buildTokenParts).mockResolvedValue([fakePart("Error")]);

    const { result } = renderHook(() => useTokenSpec());

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    await act(async () => {
      await result.current.exportThreeMf();
    });

    expect(downloadBlob).not.toHaveBeenCalled();
    expect(result.current.exportError).toContain("invalid mesh");
  });

  it("imports a valid spec JSON file and replaces the current spec", async () => {
    const { result } = renderHook(() => useTokenSpec());

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    const importedSpec = { ...result.current.spec, printProfileId: "fdm-08" };
    const file = new File([JSON.stringify(importedSpec)], "spec.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current.importSpecJson(file);
    });

    expect(result.current.spec.printProfileId).toBe("fdm-08");
    expect(result.current.importError).toBeUndefined();
  });

  it("reports an import error for a file that isn't a valid token spec", async () => {
    const { result } = renderHook(() => useTokenSpec());

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    const file = new File([JSON.stringify({ notASpec: true })], "spec.json", {
      type: "application/json",
    });

    await act(async () => {
      await result.current.importSpecJson(file);
    });

    expect(result.current.importError).toBe("This file is not a valid token spec.");
  });
});
