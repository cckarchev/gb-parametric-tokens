import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./loadFont", () => ({ loadFont: vi.fn().mockResolvedValue({}) }));
vi.mock("./loadIconManifest", () => ({ loadIconManifest: vi.fn().mockResolvedValue([]) }));
vi.mock("../core/token/computeReliefComponents", () => ({ computeReliefComponents: vi.fn() }));
vi.mock("../core/token/preview/computeBaseOutlineContours", () => ({
  computeBaseOutlineContours: vi.fn(),
}));
vi.mock("../core/token/buildTokenParts", () => ({ buildTokenParts: vi.fn() }));
vi.mock("../core/token/geometry/computePlateLayout", () => ({
  computePlateLayout: vi.fn(),
}));
vi.mock("../core/token/export/combinedThreeMfModel", () => ({
  buildCombinedThreeMfModelXml: vi.fn(),
}));
vi.mock("../core/token/export/threeMfArchive", () => ({ buildThreeMfArchive: vi.fn() }));

vi.stubGlobal("self", { postMessage: vi.fn() });

const { computeFootprintMm, handleExport, handlePreview } = await import("./tokenWorker");
const { computeEffectiveStudDiameterMm, computeOuterRadiusMm } = await import(
  "../core/token/geometry/studPlacement"
);
const { computeReliefComponents } = await import("../core/token/computeReliefComponents");
const { computeBaseOutlineContours } = await import(
  "../core/token/preview/computeBaseOutlineContours"
);
const { buildTokenParts } = await import("../core/token/buildTokenParts");
const { computePlateLayout } = await import("../core/token/geometry/computePlateLayout");
const { buildCombinedThreeMfModelXml } = await import("../core/token/export/combinedThreeMfModel");
const { buildThreeMfArchive } = await import("../core/token/export/threeMfArchive");

import type { TokenItem } from "../core/token/catalog/tokenItems/tokenItem";
import type { TokenPart } from "../core/token/mesh/tokenPart";
import { arcSpec, discSpec } from "../core/token/testSpecs";
import type { ColorGroupSpec } from "../core/token/types";
import type { ExportRequest, PreviewRequest } from "./tokenWorker";

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
  vi.mocked(computePlateLayout).mockReset();
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
      (computeOuterRadiusMm(shape) + computeEffectiveStudDiameterMm(shape) / 2) * 2;

    const footprint = computeFootprintMm(arcSpec.shape);

    expect(footprint).toEqual({ width: expectedSpanMm, height: expectedSpanMm });
  });
});

describe("handlePreview", () => {
  it("aggregates valid and invalid counts, dropping the redundant source label when the only failing text matches the token's own title", async () => {
    vi.mocked(computeReliefComponents)
      .mockResolvedValueOnce({
        reliefComponents: [{ contours: [[[0, 0]]] }],
        warnings: ["warn-a"],
        valid: true,
        componentFailures: [],
      })
      .mockResolvedValueOnce({
        reliefComponents: [{ contours: [[[1, 1]]] }],
        warnings: [],
        valid: false,
        componentFailures: [
          {
            kind: "stroke-width",
            source: { kind: "text", text: "Token B" },
            vanishedFeatureCount: 1,
            featureCount: 1,
          },
        ],
      });
    vi.mocked(computeBaseOutlineContours)
      .mockResolvedValueOnce([[[-1, -1]]])
      .mockResolvedValueOnce([[[-2, -2]]]);

    const items: TokenItem[] = [
      {
        id: "a",
        label: "Tapper: Token A",
        group: "Tapper",
        name: "Token A",
        spec: discSpec,
        copies: 13,
      },
      { id: "b", label: "Token B", name: "Token B", spec: discSpec, copies: 1 },
    ];
    const request: PreviewRequest = { kind: "preview", requestId: 7, items };

    const response = await handlePreview(request);

    expect(response.requestId).toBe(7);
    expect(response.validCount).toBe(1);
    expect(response.invalidCount).toBe(1);
    expect(response.results).toEqual([
      {
        id: "a",
        label: "Tapper: Token A",
        group: "Tapper",
        name: "Token A",
        shape: discSpec.shape,
        baseContours: [[[-1, -1]]],
        reliefComponents: [{ contours: [[[0, 0]]] }],
        warnings: ["warn-a"],
        copies: 13,
        valid: true,
        reason: "",
      },
      {
        id: "b",
        label: "Token B",
        group: undefined,
        name: "Token B",
        shape: discSpec.shape,
        baseContours: [[[-2, -2]]],
        reliefComponents: [{ contours: [[[1, 1]]] }],
        warnings: [],
        copies: 1,
        valid: false,
        reason: "1 of 1 detail too thin to print at this size.",
      },
    ]);
  });

  it("keeps the source label when the failing component isn't the token's own name (an icon, or a second line worded differently)", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValueOnce({
      reliefComponents: [],
      warnings: [],
      valid: false,
      componentFailures: [
        {
          kind: "stroke-width",
          source: { kind: "icon", iconId: "axe" },
          vanishedFeatureCount: 1,
          featureCount: 2,
        },
        {
          kind: "stroke-width",
          source: { kind: "text", text: "A second line" },
          vanishedFeatureCount: 3,
          featureCount: 4,
        },
      ],
    });
    vi.mocked(computeBaseOutlineContours).mockResolvedValueOnce([[[-1, -1]]]);

    const items: TokenItem[] = [
      { id: "a", label: "Token A", name: "Token A", spec: discSpec, copies: 1 },
    ];
    const request: PreviewRequest = { kind: "preview", requestId: 8, items };

    const response = await handlePreview(request);

    expect(response.results[0].reason).toBe(
      'Icon "axe": 1 of 2 details too thin to print at this size.\n' +
        'Text "A second line": 3 of 4 details too thin to print at this size.',
    );
  });

  it("collapses two identically-worded failures into one line, e.g. a left and right stud icon that are the same icon and fail the same way", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValueOnce({
      reliefComponents: [],
      warnings: [],
      valid: false,
      componentFailures: [
        {
          kind: "stroke-width",
          source: { kind: "icon", iconId: "Cooks" },
          vanishedFeatureCount: 3,
          featureCount: 11,
        },
        {
          kind: "stroke-width",
          source: { kind: "icon", iconId: "Cooks" },
          vanishedFeatureCount: 3,
          featureCount: 11,
        },
        {
          kind: "stroke-width",
          source: { kind: "text", text: "Singled Out" },
          vanishedFeatureCount: 9,
          featureCount: 11,
        },
      ],
    });
    vi.mocked(computeBaseOutlineContours).mockResolvedValueOnce([[[-1, -1]]]);

    const items: TokenItem[] = [
      { id: "a", label: "Singled Out", name: "Singled Out", spec: discSpec, copies: 1 },
    ];
    const request: PreviewRequest = { kind: "preview", requestId: 9, items };

    const response = await handlePreview(request);

    expect(response.results[0].reason).toBe(
      'Icon "Cooks": 3 of 11 details too thin to print at this size.\n' +
        "9 of 11 details too thin to print at this size.",
    );
  });

  it("names the overflowing icon when it extends past its target circle", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValueOnce({
      reliefComponents: [],
      warnings: [],
      valid: false,
      componentFailures: [{ kind: "icon-overflow", source: { kind: "icon", iconId: "Cooks" } }],
    });
    vi.mocked(computeBaseOutlineContours).mockResolvedValueOnce([[[-1, -1]]]);

    const items: TokenItem[] = [
      { id: "a", label: "Token A", name: "Token A", spec: discSpec, copies: 1 },
    ];
    const request: PreviewRequest = { kind: "preview", requestId: 10, items };

    const response = await handlePreview(request);

    expect(response.results[0].reason).toBe(
      'Icon "Cooks": extends past its circle and nothing corrects it -- see "Icons that overflow their circle".',
    );
  });
});

describe("handleExport", () => {
  it("collects a failure for a spec that fails the stroke-width validation", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue({
      reliefComponents: [],
      warnings: [],
      valid: false,
      componentFailures: [
        {
          kind: "stroke-width",
          source: { kind: "text", text: "Token A" },
          vanishedFeatureCount: 1,
          featureCount: 1,
        },
      ],
    });
    vi.mocked(buildTokenParts).mockResolvedValue([fakePart("NoError")]);

    const items: TokenItem[] = [
      { id: "a", label: "Token A", name: "Token A", spec: discSpec, copies: 1 },
    ];
    const request: ExportRequest = { kind: "export", requestId: 1, items, colorGroups };

    const response = await handleExport(request);

    expect(response.status).toBe("failed");
    if (response.status === "failed") {
      expect(response.failures).toEqual([
        { id: "a", label: "Token A", reason: "Fails the minimum stroke width check." },
      ]);
    }
    expect(computePlateLayout).not.toHaveBeenCalled();
  });

  it("collects a failure for a part with a non-NoError manifold status", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue({
      reliefComponents: [],
      warnings: [],
      valid: true,
      componentFailures: [],
    });
    vi.mocked(buildTokenParts).mockResolvedValue([fakePart("Error")]);

    const items: TokenItem[] = [
      { id: "a", label: "Token A", name: "Token A", spec: discSpec, copies: 1 },
    ];
    const request: ExportRequest = { kind: "export", requestId: 1, items, colorGroups };

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
      valid: true,
      componentFailures: [],
    });

    const discPart = fakePart("NoError");
    const arcPart = fakePart("NoError");

    vi.mocked(buildTokenParts).mockResolvedValueOnce([discPart]).mockResolvedValueOnce([arcPart]);

    const discOffsets = [[0, 0]] as [number, number][];
    const arcOffsets = [
      [0, 0],
      [10, 0],
    ] as [number, number][];

    vi.mocked(computePlateLayout).mockReturnValue([discOffsets, arcOffsets]);
    vi.mocked(buildCombinedThreeMfModelXml).mockReturnValue("<model/>");

    const archive = new Uint8Array([1, 2, 3]);

    vi.mocked(buildThreeMfArchive).mockReturnValue(archive);

    const items: TokenItem[] = [
      { id: "disc-a", label: "Disc A", name: "Disc A", spec: discSpec, copies: 1 },
      { id: "arc-a", label: "Arc A", name: "Arc A", spec: arcSpec, copies: 2 },
    ];
    const request: ExportRequest = { kind: "export", requestId: 9, items, colorGroups };

    const response = await handleExport(request);

    expect(computePlateLayout).toHaveBeenCalledWith(
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
