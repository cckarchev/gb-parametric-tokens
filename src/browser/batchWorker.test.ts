import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./loadFont", () => ({ loadFont: vi.fn().mockResolvedValue({}) }));
vi.mock("./loadIconManifest", () => ({ loadIconManifest: vi.fn().mockResolvedValue([]) }));
vi.mock("../core/token/computeReliefComponents", () => ({ computeReliefComponents: vi.fn() }));
vi.mock("../core/token/preview/computeBaseOutlineContours", () => ({
  computeBaseOutlineContours: vi.fn(),
}));
vi.mock("../core/token/buildTokenParts", () => ({ buildTokenParts: vi.fn() }));
vi.mock("../core/token/geometry/computeBatchPlateLayout", () => ({
  computeBatchPlateLayout: vi.fn(),
}));
vi.mock("../core/token/export/combinedThreeMfModel", () => ({
  buildCombinedThreeMfModelXml: vi.fn(),
}));
vi.mock("../core/token/export/threeMfArchive", () => ({ buildThreeMfArchive: vi.fn() }));

vi.stubGlobal("self", { postMessage: vi.fn() });

const { computeFootprintMm, handleExport, handlePreview } = await import("./batchWorker");
const { computeEffectiveNobDiameterMm, computeOuterRadiusMm } = await import(
  "../core/token/geometry/nobPlacement"
);
const { computeReliefComponents } = await import("../core/token/computeReliefComponents");
const { computeBaseOutlineContours } = await import(
  "../core/token/preview/computeBaseOutlineContours"
);
const { buildTokenParts } = await import("../core/token/buildTokenParts");
const { computeBatchPlateLayout } = await import("../core/token/geometry/computeBatchPlateLayout");
const { buildCombinedThreeMfModelXml } = await import("../core/token/export/combinedThreeMfModel");
const { buildThreeMfArchive } = await import("../core/token/export/threeMfArchive");

import type { BatchItem } from "../core/token/catalog/buildBatchItems";
import type { TokenPart } from "../core/token/mesh/tokenPart";
import type { ColorGroupSpec, TokenSpec } from "../core/token/types";
import type { BatchExportRequest, BatchPreviewRequest } from "./batchWorker";

const discSpec: TokenSpec = {
  version: 1,
  shape: { type: "disc", diameterMm: 25 },
  textLayout: "flat",
  lines: [],
  icons: [],
  decorations: [],
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  colorGroups: [],
  printProfileId: "fdm-04",
  fitPolicy: { minTracking: 0, maxTracking: 0, minScale: 1, allowTwoLines: false },
};

const arcSpec: TokenSpec = {
  version: 1,
  shape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, nobDiameterMm: 24 },
  textLayout: "arc",
  lines: [],
  icons: [],
  decorations: [],
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  colorGroups: [],
  printProfileId: "fdm-04",
  fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
};

const colorGroups: ColorGroupSpec[] = [{ id: "base", name: "Base", color: "#2B2B2B" }];

const fakePart = (status: string): TokenPart =>
  ({
    colorGroupId: "base",
    manifold: { status: () => status },
  }) as unknown as TokenPart;

beforeEach(() => {
  vi.mocked(computeReliefComponents).mockReset();
  vi.mocked(computeBaseOutlineContours).mockReset();
  vi.mocked(buildTokenParts).mockReset();
  vi.mocked(computeBatchPlateLayout).mockReset();
  vi.mocked(buildCombinedThreeMfModelXml).mockReset();
  vi.mocked(buildThreeMfArchive).mockReset();
});

describe("computeFootprintMm", () => {
  it("uses the diameter for a disc shape", () => {
    const footprint = computeFootprintMm(discSpec.shape);

    expect(footprint).toEqual({ width: 25, height: 25 });
  });

  it("uses a conservative square bounding box for an arc shape", () => {
    const shape = arcSpec.shape as Extract<typeof arcSpec.shape, { type: "arc" }>;
    const expectedSpanMm =
      (computeOuterRadiusMm(shape) + computeEffectiveNobDiameterMm(shape) / 2) * 2;

    const footprint = computeFootprintMm(arcSpec.shape);

    expect(footprint).toEqual({ width: expectedSpanMm, height: expectedSpanMm });
  });
});

describe("handlePreview", () => {
  it("aggregates valid and invalid counts and strips the internal valid flag", async () => {
    vi.mocked(computeReliefComponents)
      .mockResolvedValueOnce({
        reliefComponents: [{ contours: [[[0, 0]]] }],
        warnings: ["warn-a"],
        validation: {
          valid: true,
          areaBeforeMm2: 1,
          areaAfterErosionMm2: 1,
          featureCount: 1,
          vanishedFeatureCount: 0,
        },
      })
      .mockResolvedValueOnce({
        reliefComponents: [{ contours: [[[1, 1]]] }],
        warnings: [],
        validation: {
          valid: false,
          areaBeforeMm2: 1,
          areaAfterErosionMm2: 0,
          featureCount: 1,
          vanishedFeatureCount: 1,
        },
      });
    vi.mocked(computeBaseOutlineContours)
      .mockResolvedValueOnce([[[-1, -1]]])
      .mockResolvedValueOnce([[[-2, -2]]]);

    const items: BatchItem[] = [
      { id: "a", label: "Token A", spec: discSpec, copies: 13 },
      { id: "b", label: "Token B", spec: discSpec, copies: 1 },
    ];
    const request: BatchPreviewRequest = { kind: "preview", requestId: 7, items };

    const response = await handlePreview(request);

    expect(response.requestId).toBe(7);
    expect(response.validCount).toBe(1);
    expect(response.invalidCount).toBe(1);
    expect(response.results).toEqual([
      {
        id: "a",
        label: "Token A",
        shape: discSpec.shape,
        baseContours: [[[-1, -1]]],
        reliefComponents: [{ contours: [[[0, 0]]] }],
        warnings: ["warn-a"],
        copies: 13,
      },
      {
        id: "b",
        label: "Token B",
        shape: discSpec.shape,
        baseContours: [[[-2, -2]]],
        reliefComponents: [{ contours: [[[1, 1]]] }],
        warnings: [],
        copies: 1,
      },
    ]);
  });
});

describe("handleExport", () => {
  it("collects a failure for a spec that fails the stroke-width validation", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue({
      reliefComponents: [],
      warnings: [],
      validation: {
        valid: false,
        areaBeforeMm2: 1,
        areaAfterErosionMm2: 0,
        featureCount: 1,
        vanishedFeatureCount: 1,
      },
    });
    vi.mocked(buildTokenParts).mockResolvedValue([fakePart("NoError")]);

    const items: BatchItem[] = [{ id: "a", label: "Token A", spec: discSpec, copies: 1 }];
    const request: BatchExportRequest = { kind: "export", requestId: 1, items, colorGroups };

    const response = await handleExport(request);

    expect(response.status).toBe("failed");
    if (response.status === "failed") {
      expect(response.failures).toEqual([
        { id: "a", label: "Token A", reason: "Fails the minimum stroke width check." },
      ]);
    }
    expect(computeBatchPlateLayout).not.toHaveBeenCalled();
  });

  it("collects a failure for a part with a non-NoError manifold status", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue({
      reliefComponents: [],
      warnings: [],
      validation: {
        valid: true,
        areaBeforeMm2: 1,
        areaAfterErosionMm2: 1,
        featureCount: 1,
        vanishedFeatureCount: 0,
      },
    });
    vi.mocked(buildTokenParts).mockResolvedValue([fakePart("Error")]);

    const items: BatchItem[] = [{ id: "a", label: "Token A", spec: discSpec, copies: 1 }];
    const request: BatchExportRequest = { kind: "export", requestId: 1, items, colorGroups };

    const response = await handleExport(request);

    expect(response.status).toBe("failed");
    if (response.status === "failed") {
      expect(response.failures).toEqual([
        { id: "a", label: "Token A", reason: "Invalid mesh (status: Error)." },
      ]);
    }
  });

  it("lays out and combines the plate when every item is valid", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue({
      reliefComponents: [],
      warnings: [],
      validation: {
        valid: true,
        areaBeforeMm2: 1,
        areaAfterErosionMm2: 1,
        featureCount: 1,
        vanishedFeatureCount: 0,
      },
    });

    const discPart = fakePart("NoError");
    const arcPart = fakePart("NoError");

    vi.mocked(buildTokenParts).mockResolvedValueOnce([discPart]).mockResolvedValueOnce([arcPart]);

    const discOffsets = [[0, 0]] as [number, number][];
    const arcOffsets = [
      [0, 0],
      [10, 0],
    ] as [number, number][];

    vi.mocked(computeBatchPlateLayout).mockReturnValue([discOffsets, arcOffsets]);
    vi.mocked(buildCombinedThreeMfModelXml).mockReturnValue("<model/>");

    const archive = new Uint8Array([1, 2, 3]);

    vi.mocked(buildThreeMfArchive).mockReturnValue(archive);

    const items: BatchItem[] = [
      { id: "disc-a", label: "Disc A", spec: discSpec, copies: 1 },
      { id: "arc-a", label: "Arc A", spec: arcSpec, copies: 2 },
    ];
    const request: BatchExportRequest = { kind: "export", requestId: 9, items, colorGroups };

    const response = await handleExport(request);

    expect(computeBatchPlateLayout).toHaveBeenCalledWith(
      [
        { shapeType: "disc", footprintMm: { width: 25, height: 25 }, copies: 1 },
        { shapeType: "arc", footprintMm: { width: 84.5, height: 84.5 }, copies: 2 },
      ],
      10,
    );
    expect(buildCombinedThreeMfModelXml).toHaveBeenCalledWith(
      [
        { parts: [discPart], offsets: discOffsets },
        { parts: [arcPart], offsets: arcOffsets },
      ],
      colorGroups,
    );
    expect(buildThreeMfArchive).toHaveBeenCalledWith("<model/>");
    expect(response).toEqual({ kind: "export", requestId: 9, status: "ok", archive });
  });
});
