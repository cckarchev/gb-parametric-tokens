import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./loadFont", () => ({
  loadCatalogFont: vi.fn(async (fontId: string | undefined) => ({ loadedFontId: fontId })),
}));
vi.mock("./loadIconManifest", () => ({ loadIconManifest: vi.fn().mockResolvedValue([]) }));
vi.mock("@/core/token/relief/computeReliefComponents", () => ({
  computeReliefComponents: vi.fn(),
}));
vi.mock("@/core/token/preview/computeBaseOutlineContours", () => ({
  computeBaseOutlineContours: vi.fn(),
}));
vi.mock("@/core/token/buildTokenParts", () => ({ buildTokenParts: vi.fn() }));
vi.mock("@/core/token/geometry/computePlateLayout", () => ({
  computePlateLayout: vi.fn(),
}));
vi.mock("@/core/token/export/three-mf/combinedModel", () => ({
  buildCombinedThreeMfModel: vi.fn(),
}));
vi.mock("@/core/token/export/three-mf/archive", () => ({ buildThreeMfArchive: vi.fn() }));

vi.stubGlobal("self", { postMessage: vi.fn() });

const { handleExport, handlePreview } = await import("./tokenWorker");
const { computeReliefComponents } = await import("@/core/token/relief/computeReliefComponents");
const { computeBaseOutlineContours } = await import(
  "@/core/token/preview/computeBaseOutlineContours"
);
const { buildTokenParts } = await import("@/core/token/buildTokenParts");
const { computePlateLayout } = await import("@/core/token/geometry/computePlateLayout");
const { buildCombinedThreeMfModel } = await import("@/core/token/export/three-mf/combinedModel");
const { buildThreeMfArchive } = await import("@/core/token/export/three-mf/archive");

import type { TokenItem } from "@/core/token/catalog/token-items/tokenItem";
import type { TokenPart } from "@/core/token/mesh/tokenPart";
import { arcSpec, discSpec } from "@/core/token/testSpecs";
import { DEFAULT_DISPLAY_FONT_ID } from "@/core/token/text/fontCatalog";
import type { ColorGroupSpec } from "@/core/token/types";

import type { ExportRequest, PreviewRequest } from "./tokenWorker";

const colorGroups: ColorGroupSpec[] = [{ id: "base", name: "Base", color: "#2B2B2B" }];

const FAKE_MODEL = { modelXml: "<model/>", prusaModelConfigXml: "<config/>" };

const FAKE_PART_BOX = { min: [-12.5, -12.5, 0], max: [12.5, 12.5, 3] };

const fakePart = (status: string): TokenPart =>
  ({
    colorGroupId: "base",
    manifold: { status: () => status, boundingBox: () => FAKE_PART_BOX },
  }) as unknown as TokenPart;

beforeEach(() => {
  vi.mocked(computeReliefComponents).mockReset();
  vi.mocked(computeBaseOutlineContours).mockReset();
  vi.mocked(buildTokenParts).mockReset();
  vi.mocked(computePlateLayout).mockReset();
  vi.mocked(buildCombinedThreeMfModel).mockReset();
  vi.mocked(buildThreeMfArchive).mockReset();
});

describe("resource loading", () => {
  it("tries loading the icon manifest again after a failed attempt instead of failing every later request", async () => {
    // A fresh module, so the resources the other tests already loaded aren't cached here.
    vi.resetModules();

    const freshWorker = await import("./tokenWorker");
    const { loadIconManifest } = await import("./loadIconManifest");
    const emptyRequest: PreviewRequest = { kind: "preview", requestId: 1, items: [] };

    vi.mocked(loadIconManifest).mockRejectedValueOnce(new Error("Failed to load: Not Found"));

    await expect(freshWorker.handlePreview(emptyRequest)).rejects.toThrow("Not Found");
    await expect(freshWorker.handlePreview(emptyRequest)).resolves.toMatchObject({
      results: [],
    });
  });
});

describe("handlePreview", () => {
  it("lays out each token in its own font", async () => {
    const reliefResult = {
      reliefComponents: [],
      warnings: [],
      valid: true,
      blocksExport: false,
      componentFailures: [],
    };
    vi.mocked(computeReliefComponents).mockResolvedValue(reliefResult);
    vi.mocked(computeBaseOutlineContours).mockResolvedValue([]);

    const items: TokenItem[] = [
      { id: "default", label: "Default", name: "Default", spec: discSpec, copies: 1 },
      {
        id: "display",
        label: "Display",
        name: "Display",
        spec: { ...discSpec, fontId: DEFAULT_DISPLAY_FONT_ID },
        copies: 1,
      },
    ];

    await handlePreview({ kind: "preview", requestId: 1, items });

    const fontsUsed = vi.mocked(computeReliefComponents).mock.calls.map((call) => call[1]);

    expect(fontsUsed).toEqual([
      { loadedFontId: undefined },
      { loadedFontId: DEFAULT_DISPLAY_FONT_ID },
    ]);
  });

  it("returns one result per item, with its outline, relief, warnings and failure reason", async () => {
    vi.mocked(computeReliefComponents)
      .mockResolvedValueOnce({
        reliefComponents: [{ source: { kind: "decoration" }, contours: [[[0, 0]]] }],
        warnings: ["warn-a"],
        valid: true,
        blocksExport: false,
        componentFailures: [],
      })
      .mockResolvedValueOnce({
        reliefComponents: [{ source: { kind: "decoration" }, contours: [[[1, 1]]] }],
        warnings: [],
        valid: false,
        blocksExport: true,
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
    expect(response.results).toEqual([
      {
        id: "a",
        label: "Tapper: Token A",
        group: "Tapper",
        name: "Token A",
        shape: discSpec.shape,
        baseContours: [[[-1, -1]]],
        reliefComponents: [{ source: { kind: "decoration" }, contours: [[[0, 0]]] }],
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
        reliefComponents: [{ source: { kind: "decoration" }, contours: [[[1, 1]]] }],
        warnings: [],
        copies: 1,
        valid: false,
        reason: "1 of 1 detail too thin to print at this size.",
      },
    ]);
  });
});

describe("handleExport", () => {
  it("collects a failure for a spec that fails the stroke-width validation", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue({
      reliefComponents: [],
      warnings: [],
      valid: false,
      blocksExport: true,
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
        { id: "a", label: "Token A", reason: "1 of 1 detail too thin to print at this size." },
      ]);
    }
    expect(computePlateLayout).not.toHaveBeenCalled();
  });

  it("still exports a token whose only failures are layout warnings", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue({
      reliefComponents: [],
      warnings: [],
      valid: false,
      blocksExport: false,
      componentFailures: [
        {
          kind: "crest-over-text",
          source: { kind: "icon", iconId: "Brewers" },
          textSource: { kind: "text", text: "Token A" },
        },
      ],
    });
    vi.mocked(buildTokenParts).mockResolvedValue([fakePart("NoError")]);
    vi.mocked(computePlateLayout).mockReturnValue([[[0, 0]]]);
    vi.mocked(buildCombinedThreeMfModel).mockReturnValue(FAKE_MODEL);
    vi.mocked(buildThreeMfArchive).mockReturnValue(new Uint8Array([1]));

    const items: TokenItem[] = [
      { id: "a", label: "Token A", name: "Token A", spec: discSpec, copies: 1 },
    ];
    const request: ExportRequest = { kind: "export", requestId: 1, items, colorGroups };

    const response = await handleExport(request);

    expect(response.status).toBe("ok");
  });

  it("collects a failure for a part with a non-NoError manifold status", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue({
      reliefComponents: [],
      warnings: [],
      valid: true,
      blocksExport: false,
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
      blocksExport: false,
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
    vi.mocked(buildCombinedThreeMfModel).mockReturnValue(FAKE_MODEL);

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
        { shapeType: "disc", boundsMm: { min: [-12.5, -12.5], max: [12.5, 12.5] }, copies: 1 },
        { shapeType: "arc", boundsMm: { min: [-12.5, -12.5], max: [12.5, 12.5] }, copies: 2 },
      ],
      10,
    );
    expect(buildCombinedThreeMfModel).toHaveBeenCalledWith(
      [
        { name: "Disc A", parts: [discPart], offsets: discOffsets },
        { name: "Arc A", parts: [arcPart], offsets: arcOffsets },
      ],
      colorGroups,
    );
    expect(buildThreeMfArchive).toHaveBeenCalledWith("<model/>", "<config/>");
    expect(response).toEqual({ kind: "export", requestId: 9, status: "ok", archive });
  });
});
