import { describe, expect, it } from "vitest";

import { buildTokenParts } from "./buildTokenParts";
import { computeStudPlacements } from "./geometry/studPlacement";
import { TokenSpec, Vec2 } from "./types";

const squareAt = (center: Vec2): Vec2[][] => [
  [
    [center[0] - 2, center[1] - 2],
    [center[0] + 2, center[1] - 2],
    [center[0] + 2, center[1] + 2],
    [center[0] - 2, center[1] + 2],
  ],
];

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
  shape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, studDiameterMm: 24 },
  textLayout: "arc",
  lines: [],
  icons: [],
  decorations: [],
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  colorGroups: [],
  printProfileId: "fdm-04",
  fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
};

describe("buildTokenParts", () => {
  it("dispatches to buildTokenMesh for a disc shape", async () => {
    const parts = await buildTokenParts(discSpec, [{ contours: squareAt([0, 0]) }]);

    expect(parts).toHaveLength(1);
    expect(parts[0].colorGroupId).toBe("base");
    expect(parts[0].manifold.status()).toBe("NoError");
  });

  it("dispatches to buildArcTokenMesh for an arc shape", async () => {
    const shape = arcSpec.shape as Extract<TokenSpec["shape"], { type: "arc" }>;
    const studPlacements = computeStudPlacements(shape, 90);

    const parts = await buildTokenParts(arcSpec, [
      { contours: squareAt(studPlacements.left.position) },
      { contours: squareAt(studPlacements.right.position) },
    ]);

    expect(parts).toHaveLength(1);
    expect(parts[0].colorGroupId).toBe("base");
    expect(parts[0].manifold.status()).toBe("NoError");
  });

  it("keeps a distinctly colorGrouped component separate on an arc shape", async () => {
    const shape = arcSpec.shape as Extract<TokenSpec["shape"], { type: "arc" }>;
    const studPlacements = computeStudPlacements(shape, 90);

    const parts = await buildTokenParts(arcSpec, [
      { contours: squareAt(studPlacements.left.position), colorGroup: "accent" },
    ]);

    expect(parts.map((part) => part.colorGroupId).sort()).toEqual(["accent", "base"]);
  });
});
