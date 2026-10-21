import { describe, expect, it } from "vitest";

import type { TokenSpec, Vec2 } from "../types";
import { buildTokenMesh } from "./buildTokenMesh";
import type { ReliefComponent } from "./reliefComponent";

const DISC_DIAMETER_MM = 25;
const DISC_RADIUS_MM = DISC_DIAMETER_MM / 2;
const BASE_THICKNESS_MM = 3;
const RELIEF_HEIGHT_MM = 0.6;
// The thinnest floor left under an engraving or inlay pocket.
const MIN_FLOOR_MM = 0.4;
const VOLUME_PRECISION_DIGITS = 3;

// An axis-aligned square centered on the origin.
const centeredSquare = (halfMm: number): Vec2[][] => [
  [
    [-halfMm, -halfMm],
    [halfMm, -halfMm],
    [halfMm, halfMm],
    [-halfMm, halfMm],
  ],
];

const baseSpec = (overrides: Partial<TokenSpec["style"]> = {}): TokenSpec => ({
  version: 1,
  shape: { type: "disc", diameterMm: DISC_DIAMETER_MM },
  textLayout: "flat",
  lines: [],
  icons: [],
  decorations: [],
  style: {
    relief: "raised",
    reliefHeightMm: RELIEF_HEIGHT_MM,
    baseThicknessMm: BASE_THICKNESS_MM,
    ...overrides,
  },
  colorGroups: [],
  printProfileId: "fdm-04",
  fitPolicy: {
    minTracking: 0,
    maxTracking: 0,
    minScale: 1,
    allowTwoLines: false,
  },
});

// 6x6mm, well inside the disc.
const ICON_HALF_SIZE_MM = 3;
const squareIcon = centeredSquare(ICON_HALF_SIZE_MM);

describe("buildTokenMesh", () => {
  it("produces one base part whose top is raised above the base thickness for relief: raised", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "raised" }),
      reliefComponents: [
        { source: { kind: "decoration" }, contours: squareIcon },
      ],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].colorGroupId).toBe("base");
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[2]).toBeGreaterThan(
      BASE_THICKNESS_MM,
    );
  });

  it("keeps the manifold within the base thickness for relief: engraved", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "engraved" }),
      reliefComponents: [
        { source: { kind: "decoration" }, contours: squareIcon },
      ],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[2]).toBe(BASE_THICKNESS_MM);
  });
});

describe("buildTokenMesh inlay", () => {
  it("fills a pocket in the base with a flush relief part for relief: inlay", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "inlay" }),
      reliefComponents: [
        {
          source: { kind: "decoration" },
          contours: squareIcon,
          colorGroup: "text",
        },
      ],
    });
    const plainDisc = await buildTokenMesh({
      spec: baseSpec(),
      reliefComponents: [],
    });

    const basePart = parts.find((part) => part.colorGroupId === "base");
    const textPart = parts.find((part) => part.colorGroupId === "text");

    expect(parts).toHaveLength(2);
    expect(basePart?.manifold.status()).toBe("NoError");
    expect(textPart?.manifold.status()).toBe("NoError");

    // Both parts end flush at the base thickness: a flat token.
    expect(basePart?.manifold.boundingBox().max[2]).toBe(BASE_THICKNESS_MM);
    expect(textPart?.manifold.boundingBox().max[2]).toBeCloseTo(
      BASE_THICKNESS_MM,
    );
    expect(textPart?.manifold.boundingBox().min[2]).toBeCloseTo(
      BASE_THICKNESS_MM - RELIEF_HEIGHT_MM,
    );

    // The pocket is exactly the inlay: together they add up to the plain disc, no gap, no overlap.
    const combinedVolume =
      (basePart?.manifold.volume() ?? 0) + (textPart?.manifold.volume() ?? 0);

    expect(combinedVolume).toBeCloseTo(
      plainDisc[0].manifold.volume(),
      VOLUME_PRECISION_DIGITS,
    );
  });
});

describe("buildTokenMesh minimum floor", () => {
  it("never engraves through the base: a cut deeper than the base stops at a minimum floor", async () => {
    const thinBase = { reliefHeightMm: 3, baseThicknessMm: 1 };
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "engraved", ...thinBase }),
      reliefComponents: [
        { source: { kind: "decoration" }, contours: squareIcon },
      ],
    });
    const plainDisc = await buildTokenMesh({
      spec: baseSpec(thinBase),
      reliefComponents: [],
    });

    // The 6x6 square is cut 1 - 0.4 deep, leaving a 0.4mm floor under it.
    const squareAreaMm2 = 36;
    const clampedDepthMm = 0.6;

    expect(parts[0].manifold.volume()).toBeCloseTo(
      plainDisc[0].manifold.volume() - squareAreaMm2 * clampedDepthMm,
      VOLUME_PRECISION_DIGITS,
    );
  });

  it("never inlays below the bed: a pocket deeper than the base stops at a minimum floor", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({
        relief: "inlay",
        reliefHeightMm: 3,
        baseThicknessMm: 1,
      }),
      reliefComponents: [
        {
          source: { kind: "decoration" },
          contours: squareIcon,
          colorGroup: "text",
        },
      ],
    });

    const textPart = parts.find((part) => part.colorGroupId === "text");

    expect(textPart?.manifold.boundingBox().min[2]).toBeCloseTo(MIN_FLOOR_MM);
    expect(textPart?.manifold.boundingBox().max[2]).toBeCloseTo(1);
  });
});

describe("buildTokenMesh flat relief and shapes", () => {
  it("leaves a base-colored relief flat, with no pocket and no extra part, for relief: inlay", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "inlay" }),
      reliefComponents: [
        { source: { kind: "decoration" }, contours: squareIcon },
      ],
    });
    const plainDisc = await buildTokenMesh({
      spec: baseSpec(),
      reliefComponents: [],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.volume()).toBeCloseTo(
      plainDisc[0].manifold.volume(),
      VOLUME_PRECISION_DIGITS,
    );
  });

  it("rejects non-disc shapes", async () => {
    const spec = {
      ...baseSpec(),
      shape: {
        type: "arc" as const,
        ribbonWidthMm: 1,
        ribbonLengthMm: 5,
        studDiameterMm: 1,
      },
    };

    await expect(
      buildTokenMesh({
        spec,
        reliefComponents: [
          { source: { kind: "decoration" }, contours: squareIcon },
        ],
      }),
    ).rejects.toThrow(/only supports a "disc" shape/);
  });
});

describe("buildTokenMesh color groups and grow outline", () => {
  it("keeps a distinctly colorGrouped icon as its own separate part for relief: raised", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "raised" }),
      reliefComponents: [
        {
          source: { kind: "decoration" },
          contours: squareIcon,
          colorGroup: "accent",
        },
      ],
    });

    expect(parts).toHaveLength(2);
    expect(parts.map((part) => part.colorGroupId).sort()).toEqual([
      "accent",
      "base",
    ]);

    const basePart = parts.find((part) => part.colorGroupId === "base");
    const accentPart = parts.find((part) => part.colorGroupId === "accent");

    // the base part alone is the bare disc: nothing raised above baseThicknessMm fused into it
    expect(basePart?.manifold.boundingBox().max[2]).toBe(BASE_THICKNESS_MM);
    expect(accentPart?.manifold.boundingBox().max[2]).toBeGreaterThan(
      BASE_THICKNESS_MM,
    );
  });

  it("unions a growOutline contour into the base, past the plain disc's own radius", async () => {
    // The disc is 25mm diameter (radius 12.5mm): this square reaches well past that.
    const growHalfSizeMm = 20;
    const growSquare = centeredSquare(growHalfSizeMm);

    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "raised" }),
      reliefComponents: [
        {
          source: { kind: "decoration" },
          contours: squareIcon,
          growOutline: growSquare,
        },
      ],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[0]).toBeGreaterThan(
      DISC_RADIUS_MM,
    );
  });
});

describe("buildTokenMesh base color group", () => {
  it("fuses an icon explicitly tagged with the base colorGroup into a single part", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "raised" }),
      reliefComponents: [
        {
          source: { kind: "decoration" },
          contours: squareIcon,
          colorGroup: "base",
        },
      ],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.boundingBox().max[2]).toBeGreaterThan(
      BASE_THICKNESS_MM,
    );
  });
});

describe("buildTokenMesh inner diameter", () => {
  it("leaves no material at the center of a disc with an inner diameter", async () => {
    const holeDiameterMm = 15;
    // A separately colorGrouped relief stays its own part, so the base part is the bare body.
    const reliefComponents: ReliefComponent[] = [
      {
        source: { kind: "decoration" },
        contours: squareIcon,
        colorGroup: "accent",
      },
    ];
    const hollowSpec: TokenSpec = {
      ...baseSpec(),
      shape: { type: "disc", diameterMm: 25, innerDiameterMm: holeDiameterMm },
    };

    const solidParts = await buildTokenMesh({
      spec: baseSpec(),
      reliefComponents,
    });
    const hollowParts = await buildTokenMesh({
      spec: hollowSpec,
      reliefComponents,
    });
    const solidBase = solidParts.find((part) => part.colorGroupId === "base");
    const hollowBase = hollowParts.find((part) => part.colorGroupId === "base");

    const holeRadiusMm = holeDiameterMm / 2;
    const thicknessMm = hollowSpec.style.baseThicknessMm;
    const holeVolume = Math.PI * holeRadiusMm * holeRadiusMm * thicknessMm;
    const removedVolume =
      (solidBase?.manifold.volume() ?? 0) -
      (hollowBase?.manifold.volume() ?? 0);

    expect(removedVolume).toBeCloseTo(holeVolume, -1);
  });
});
