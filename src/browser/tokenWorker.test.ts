import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./loadFont", () => ({
  loadCatalogFont: vi.fn(async (fontId: string | undefined) => ({
    loadedFontId: fontId,
  })),
}));
vi.mock("./loadIconManifest", () => ({
  loadIconManifest: vi.fn().mockResolvedValue([]),
}));
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
vi.mock("@/core/token/export/three-mf/archive", () => ({
  buildThreeMfArchive: vi.fn(),
}));

vi.stubGlobal("self", { postMessage: vi.fn() });

const { handleExport, handlePreview } = await import("./tokenWorker");
const { computeReliefComponents } = await import(
  "@/core/token/relief/computeReliefComponents"
);
const { computeBaseOutlineContours } = await import(
  "@/core/token/preview/computeBaseOutlineContours"
);
const { buildTokenParts } = await import("@/core/token/buildTokenParts");
const { computePlateLayout } = await import(
  "@/core/token/geometry/computePlateLayout"
);
const { buildCombinedThreeMfModel } = await import(
  "@/core/token/export/three-mf/combinedModel"
);
const { buildThreeMfArchive } = await import(
  "@/core/token/export/three-mf/archive"
);

import type { TokenItem } from "@/core/token/catalog/token-items/tokenItem";
import type { TokenPart } from "@/core/token/mesh/tokenPart";
import { arcSpec, discSpec } from "@/core/token/testSpecs";
import { DEFAULT_DISPLAY_FONT_ID } from "@/core/token/text/fontCatalog";
import type { ColorGroupSpec, Vec2 } from "@/core/token/types";

import type { ExportRequest, PreviewRequest } from "./tokenWorker";

const colorGroups: ColorGroupSpec[] = [
  { id: "base", name: "Base", color: "#2B2B2B" },
];

const FAKE_MODEL = { modelXml: "<model/>", prusaModelConfigXml: "<config/>" };

const FAKE_PART_HALF_SIZE_MM = 12.5;
const FAKE_PART_HEIGHT_MM = 3;
const FAKE_PART_BOX = {
  min: [-FAKE_PART_HALF_SIZE_MM, -FAKE_PART_HALF_SIZE_MM, 0],
  max: [FAKE_PART_HALF_SIZE_MM, FAKE_PART_HALF_SIZE_MM, FAKE_PART_HEIGHT_MM],
};
// The flat footprint computePartsBounds reads off FAKE_PART_BOX.
const FAKE_PART_BOUNDS_MM = {
  min: [-FAKE_PART_HALF_SIZE_MM, -FAKE_PART_HALF_SIZE_MM],
  max: [FAKE_PART_HALF_SIZE_MM, FAKE_PART_HALF_SIZE_MM],
};

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
    const emptyRequest: PreviewRequest = {
      kind: "preview",
      requestId: 1,
      items: [],
    };

    vi.mocked(loadIconManifest).mockRejectedValueOnce(
      new Error("Failed to load: Not Found"),
    );

    await expect(freshWorker.handlePreview(emptyRequest)).rejects.toThrow(
      "Not Found",
    );
    await expect(
      freshWorker.handlePreview(emptyRequest),
    ).resolves.toMatchObject({
      results: [],
    });
  });
});

type ReliefResult = Awaited<ReturnType<typeof computeReliefComponents>>;

// A token whose relief is clean: nothing to warn about, nothing blocking its export.
const CLEAN_RELIEF: ReliefResult = {
  reliefComponents: [],
  warnings: [],
  valid: true,
  blocksExport: false,
  componentFailures: [],
};

const TOKEN_A: TokenItem = {
  id: "a",
  label: "Token A",
  name: "Token A",
  spec: discSpec,
  copies: 1,
};

const exportRequest = (items: TokenItem[]): ExportRequest => ({
  kind: "export",
  requestId: 1,
  items,
  colorGroups,
});

// Two preview fixtures: a grouped token that passes with a warning, and an ungrouped one
// whose text is too thin.
const PREVIEW_A = {
  item: {
    id: "a",
    label: "Tapper: Token A",
    group: "Tapper",
    name: "Token A",
    spec: discSpec,
    copies: 13,
  },
  relief: {
    ...CLEAN_RELIEF,
    reliefComponents: [
      { source: { kind: "decoration" as const }, contours: [[[0, 0]]] },
    ],
    warnings: ["warn-a"],
  } satisfies ReliefResult,
  baseContours: [[[-1, -1]]] satisfies Vec2[][],
};
const PREVIEW_B = {
  item: {
    id: "b",
    label: "Token B",
    name: "Token B",
    spec: discSpec,
    copies: 1,
  },
  relief: {
    ...CLEAN_RELIEF,
    reliefComponents: [
      { source: { kind: "decoration" as const }, contours: [[[1, 1]]] },
    ],
    valid: false,
    blocksExport: true,
    componentFailures: [
      {
        kind: "stroke-width" as const,
        source: { kind: "text" as const, text: "Token B" },
        vanishedFeatureCount: 1,
        featureCount: 1,
      },
    ],
  } satisfies ReliefResult,
  baseContours: [[[-2, -2]]] satisfies Vec2[][],
};

type PreviewFixture = typeof PREVIEW_A | typeof PREVIEW_B;

// The preview result a fixture's token should come back as.
const previewResult = (
  { item, relief, baseContours }: PreviewFixture,
  reason: string,
) => ({
  id: item.id,
  label: item.label,
  group: "group" in item ? item.group : undefined,
  name: item.name,
  shape: discSpec.shape,
  baseContours,
  reliefComponents: relief.reliefComponents,
  warnings: relief.warnings,
  copies: item.copies,
  valid: relief.valid,
  reason,
});

describe("handlePreview", () => {
  it("lays out each token in its own font", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue(CLEAN_RELIEF);
    vi.mocked(computeBaseOutlineContours).mockResolvedValue([]);

    const items: TokenItem[] = [
      {
        id: "default",
        label: "Default",
        name: "Default",
        spec: discSpec,
        copies: 1,
      },
      {
        id: "display",
        label: "Display",
        name: "Display",
        spec: { ...discSpec, fontId: DEFAULT_DISPLAY_FONT_ID },
        copies: 1,
      },
    ];

    await handlePreview({ kind: "preview", requestId: 1, items });

    const fontsUsed = vi
      .mocked(computeReliefComponents)
      .mock.calls.map((call) => call[1]);

    expect(fontsUsed).toEqual([
      { loadedFontId: undefined },
      { loadedFontId: DEFAULT_DISPLAY_FONT_ID },
    ]);
  });

  it("returns one result per item, with its outline, relief, warnings and failure reason", async () => {
    vi.mocked(computeReliefComponents)
      .mockResolvedValueOnce(PREVIEW_A.relief)
      .mockResolvedValueOnce(PREVIEW_B.relief);
    vi.mocked(computeBaseOutlineContours)
      .mockResolvedValueOnce(PREVIEW_A.baseContours)
      .mockResolvedValueOnce(PREVIEW_B.baseContours as Vec2[][]);

    const request: PreviewRequest = {
      kind: "preview",
      requestId: 7,
      items: [PREVIEW_A.item, PREVIEW_B.item],
    };

    const response = await handlePreview(request);

    expect(response.requestId).toBe(request.requestId);
    expect(response.results).toEqual([
      previewResult(PREVIEW_A, ""),
      previewResult(PREVIEW_B, "1 of 1 detail too thin to print at this size."),
    ]);
  });
});

describe("handleExport failures", () => {
  it("collects a failure for a spec that fails the stroke-width validation", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue({
      ...CLEAN_RELIEF,
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

    const response = await handleExport(exportRequest([TOKEN_A]));

    expect(response.status).toBe("failed");
    if (response.status === "failed") {
      expect(response.failures).toEqual([
        {
          id: "a",
          label: "Token A",
          reason: "1 of 1 detail too thin to print at this size.",
        },
      ]);
    }
    expect(computePlateLayout).not.toHaveBeenCalled();
  });

  it("still exports a token whose only failures are layout warnings", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue({
      ...CLEAN_RELIEF,
      valid: false,
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

    const response = await handleExport(exportRequest([TOKEN_A]));

    expect(response.status).toBe("ok");
  });

  it("collects a failure for a part with a non-NoError manifold status", async () => {
    vi.mocked(computeReliefComponents).mockResolvedValue(CLEAN_RELIEF);
    vi.mocked(buildTokenParts).mockResolvedValue([fakePart("Error")]);

    const response = await handleExport(exportRequest([TOKEN_A]));

    expect(response.status).toBe("failed");
    if (response.status === "failed") {
      expect(response.failures).toEqual([
        { id: "a", label: "Token A", reason: "Invalid mesh (status: Error)." },
      ]);
    }
  });
});

describe("handleExport plate", () => {
  const discItem: TokenItem = { ...TOKEN_A, id: "disc-a", label: "Disc A" };
  const arcItem: TokenItem = {
    id: "arc-a",
    label: "Arc A",
    name: "Arc A",
    spec: arcSpec,
    copies: 2,
  };

  it("lays out and combines the plate when every item is valid", async () => {
    const discPart = fakePart("NoError");
    const arcPart = fakePart("NoError");
    const discOffsets: Vec2[] = [[0, 0]];
    const arcOffsets: Vec2[] = [
      [0, 0],
      [10, 0],
    ];
    const archive = new TextEncoder().encode("3mf archive");

    vi.mocked(computeReliefComponents).mockResolvedValue(CLEAN_RELIEF);
    vi.mocked(buildTokenParts)
      .mockResolvedValueOnce([discPart])
      .mockResolvedValueOnce([arcPart]);
    vi.mocked(computePlateLayout).mockReturnValue([discOffsets, arcOffsets]);
    vi.mocked(buildCombinedThreeMfModel).mockReturnValue(FAKE_MODEL);
    vi.mocked(buildThreeMfArchive).mockReturnValue(archive);

    const request = exportRequest([discItem, arcItem]);
    const response = await handleExport(request);

    expect(computePlateLayout).toHaveBeenCalledWith(
      [
        { shapeType: "disc", boundsMm: FAKE_PART_BOUNDS_MM, copies: 1 },
        {
          shapeType: "arc",
          boundsMm: FAKE_PART_BOUNDS_MM,
          copies: arcItem.copies,
        },
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
    expect(response).toEqual({
      kind: "export",
      requestId: request.requestId,
      status: "ok",
      archive,
    });
  });
});
