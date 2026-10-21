import { describe, expect, it } from "vitest";

import { buildTokenParts } from "./buildTokenParts";
import { computeStudPlacements } from "./geometry/studPlacement";
import { arcSpec, discSpec } from "./testSpecs";
import type { TokenSpec, Vec2 } from "./types";

const squareAt = (center: Vec2): Vec2[][] => [
  [
    [center[0] - 2, center[1] - 2],
    [center[0] + 2, center[1] - 2],
    [center[0] + 2, center[1] + 2],
    [center[0] - 2, center[1] + 2],
  ],
];

describe("buildTokenParts", () => {
  it("dispatches to buildTokenMesh for a disc shape", async () => {
    const parts = await buildTokenParts(discSpec, [
      { source: { kind: "decoration" }, contours: squareAt([0, 0]) },
    ]);

    expect(parts).toHaveLength(1);
    expect(parts[0].colorGroupId).toBe("base");
    expect(parts[0].manifold.status()).toBe("NoError");
  });

  it("dispatches to buildArcTokenMesh for an arc shape", async () => {
    const shape = arcSpec.shape as Extract<TokenSpec["shape"], { type: "arc" }>;
    const studPlacements = computeStudPlacements(shape, 90);

    const parts = await buildTokenParts(arcSpec, [
      {
        source: { kind: "decoration" },
        contours: squareAt(studPlacements.left.position),
      },
      {
        source: { kind: "decoration" },
        contours: squareAt(studPlacements.right.position),
      },
    ]);

    expect(parts).toHaveLength(1);
    expect(parts[0].colorGroupId).toBe("base");
    expect(parts[0].manifold.status()).toBe("NoError");
  });

  it("keeps a distinctly colorGrouped component separate on an arc shape", async () => {
    const shape = arcSpec.shape as Extract<TokenSpec["shape"], { type: "arc" }>;
    const studPlacements = computeStudPlacements(shape, 90);

    const parts = await buildTokenParts(arcSpec, [
      {
        source: { kind: "decoration" },
        contours: squareAt(studPlacements.left.position),
        colorGroup: "accent",
      },
    ]);

    expect(parts.map((part) => part.colorGroupId).sort()).toEqual([
      "accent",
      "base",
    ]);
  });
});
