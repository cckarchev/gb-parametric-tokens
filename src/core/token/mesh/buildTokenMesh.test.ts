import { describe, expect, it } from "vitest";

import { TokenSpec, Vec2 } from "../types";
import { buildTokenMesh } from "./buildTokenMesh";

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
      reliefComponents: [{ contours: squareIcon }],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].colorGroupId).toBe("base");
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[2]).toBeGreaterThan(3);
  });

  it("keeps the manifold within the base thickness for relief: engraved", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "engraved" }),
      reliefComponents: [{ contours: squareIcon }],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.status()).toBe("NoError");
    expect(parts[0].manifold.boundingBox().max[2]).toBe(3);
  });

  it("rejects non-disc shapes", async () => {
    const spec = {
      ...baseSpec(),
      shape: { type: "arc" as const, ribbonWidthMm: 1, ribbonLengthMm: 5, nobDiameterMm: 1 },
    };

    await expect(
      buildTokenMesh({ spec, reliefComponents: [{ contours: squareIcon }] }),
    ).rejects.toThrow(/only supports shape: "disc"/);
  });

  it("keeps a distinctly colorGrouped icon as its own separate part for relief: raised", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "raised" }),
      reliefComponents: [{ contours: squareIcon, colorGroup: "accent" }],
    });

    expect(parts).toHaveLength(2);
    expect(parts.map((part) => part.colorGroupId).sort()).toEqual(["accent", "base"]);

    const basePart = parts.find((part) => part.colorGroupId === "base");
    const accentPart = parts.find((part) => part.colorGroupId === "accent");

    // the base part alone is the bare disc: nothing raised above baseThicknessMm fused into it
    expect(basePart?.manifold.boundingBox().max[2]).toBe(3);
    expect(accentPart?.manifold.boundingBox().max[2]).toBeGreaterThan(3);
  });

  it("fuses an icon explicitly tagged with the base colorGroup into a single part", async () => {
    const parts = await buildTokenMesh({
      spec: baseSpec({ relief: "raised" }),
      reliefComponents: [{ contours: squareIcon, colorGroup: "base" }],
    });

    expect(parts).toHaveLength(1);
    expect(parts[0].manifold.boundingBox().max[2]).toBeGreaterThan(3);
  });
});
