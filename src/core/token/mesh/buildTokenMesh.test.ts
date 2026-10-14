import { describe, expect, it } from "vitest";

import { TokenSpec, Vec2 } from "../types";
import { buildTokenMesh } from "./buildTokenMesh";
import { ReliefComponent } from "./reliefComponent";

const baseSpec = (overrides: Partial<TokenSpec["style"]> = {}): TokenSpec => ({
  version: 1,
  shape: { type: "disc", diameterMm: 25 },
  textLayout: "flat",
  lines: [],
  icons: [],
  decorations: [],
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3, ...overrides },
  colorGroups: [],
  printProfileId: "fdm-04",
  fitPolicy: { minTracking: 0, maxTracking: 0, minScale: 1, allowTwoLines: false },
});

const squareIcon: Vec2[][] = [
  [
    [-3, -3],
    [3, -3],
    [3, 3],
    [-3, 3],
  ],
];

describe("buildTokenMesh", () => {
  it("produces one base part whose top is raised above the base thickness for relief: raised", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "raised" }),
      reliefComponents: [{ source: { kind: "decoration" }, contours: squareIcon }],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].colorGroupId).toBe("base");
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[2]).toBeGreaterThan(3);
  });

  it("keeps the manifold within the base thickness for relief: engraved", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "engraved" }),
      reliefComponents: [{ source: { kind: "decoration" }, contours: squareIcon }],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[2]).toBe(3);
  });

  it("fills a pocket in the base with a flush relief part for relief: inlay", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "inlay" }),
      reliefComponents: [
        { source: { kind: "decoration" }, contours: squareIcon, colorGroup: "text" },
      ],
    });
    const plainDisc = await buildTokenMesh({ spec: baseSpec(), reliefComponents: [] });

    const basePart = parts.find((part) => part.colorGroupId === "base");
    const textPart = parts.find((part) => part.colorGroupId === "text");

    expect(parts).toHaveLength(2);
    expect(basePart?.manifold.status()).toBe("NoError");
    expect(textPart?.manifold.status()).toBe("NoError");

    // Both parts end flush at the base thickness: a flat token.
    expect(basePart?.manifold.boundingBox().max[2]).toBe(3);
    expect(textPart?.manifold.boundingBox().max[2]).toBeCloseTo(3);
    expect(textPart?.manifold.boundingBox().min[2]).toBeCloseTo(3 - 0.6);

    // The pocket is exactly the inlay: together they add up to the plain disc, no gap, no overlap.
    const combinedVolume = (basePart?.manifold.volume() ?? 0) + (textPart?.manifold.volume() ?? 0);

    expect(combinedVolume).toBeCloseTo(plainDisc[0].manifold.volume(), 3);
  });

  it("leaves a base-colored relief flat, with no pocket and no extra part, for relief: inlay", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "inlay" }),
      reliefComponents: [{ source: { kind: "decoration" }, contours: squareIcon }],
    });
    const plainDisc = await buildTokenMesh({ spec: baseSpec(), reliefComponents: [] });

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.volume()).toBeCloseTo(plainDisc[0].manifold.volume(), 3);
  });

  it("rejects non-disc shapes", async () => {
    const spec = {
      ...baseSpec(),
      shape: { type: "arc" as const, ribbonWidthMm: 1, ribbonLengthMm: 5, studDiameterMm: 1 },
    };

    await expect(
      buildTokenMesh({
        spec,
        reliefComponents: [{ source: { kind: "decoration" }, contours: squareIcon }],
      }),
    ).rejects.toThrow(/only supports a "disc" shape/);
  });

  it("keeps a distinctly colorGrouped icon as its own separate part for relief: raised", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "raised" }),
      reliefComponents: [
        { source: { kind: "decoration" }, contours: squareIcon, colorGroup: "accent" },
      ],
    });

    expect(parts).toHaveLength(2);
    expect(parts.map((part) => part.colorGroupId).sort()).toEqual(["accent", "base"]);

    const basePart = parts.find((part) => part.colorGroupId === "base");
    const accentPart = parts.find((part) => part.colorGroupId === "accent");

    // the base part alone is the bare disc: nothing raised above baseThicknessMm fused into it
    expect(basePart?.manifold.boundingBox().max[2]).toBe(3);
    expect(accentPart?.manifold.boundingBox().max[2]).toBeGreaterThan(3);
  });

  it("unions a growOutline contour into the base, past the plain disc's own radius", async () => {
    // The disc is 25mm diameter (radius 12.5mm): this square reaches well past that.
    const growSquare: Vec2[][] = [
      [
        [-20, -20],
        [20, -20],
        [20, 20],
        [-20, 20],
      ],
    ];

    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "raised" }),
      reliefComponents: [
        { source: { kind: "decoration" }, contours: squareIcon, growOutline: growSquare },
      ],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[0]).toBeGreaterThan(12.5);
  });

  it("fuses an icon explicitly tagged with the base colorGroup into a single part", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "raised" }),
      reliefComponents: [
        { source: { kind: "decoration" }, contours: squareIcon, colorGroup: "base" },
      ],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.boundingBox().max[2]).toBeGreaterThan(3);
  });

  it("leaves no material at the center of a disc with an inner diameter", async () => {
    const holeDiameterMm = 15;
    // A separately colorGrouped relief stays its own part, so the base part is the bare body.
    const reliefComponents: ReliefComponent[] = [
      { source: { kind: "decoration" }, contours: squareIcon, colorGroup: "accent" },
    ];
    const hollowSpec: TokenSpec = {
      ...baseSpec(),
      shape: { type: "disc", diameterMm: 25, innerDiameterMm: holeDiameterMm },
    };

    const solidParts = await buildTokenMesh({ spec: baseSpec(), reliefComponents });
    const hollowParts = await buildTokenMesh({ spec: hollowSpec, reliefComponents });
    const solidBase = solidParts.find((part) => part.colorGroupId === "base");
    const hollowBase = hollowParts.find((part) => part.colorGroupId === "base");

    const holeRadiusMm = holeDiameterMm / 2;
    const thicknessMm = hollowSpec.style.baseThicknessMm;
    const holeVolume = Math.PI * holeRadiusMm * holeRadiusMm * thicknessMm;
    const removedVolume =
      (solidBase?.manifold.volume() ?? 0) - (hollowBase?.manifold.volume() ?? 0);

    expect(removedVolume).toBeCloseTo(holeVolume, -1);
  });
});
