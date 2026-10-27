import { describe, expect, it } from "vitest";

import type { Vec2 } from "../types";
import { computePartsBounds } from "./computePartsBounds";
import { getManifoldModule } from "./manifoldModule";
import type { TokenPart } from "./tokenPart";

const buildSquarePart = async (min: Vec2, max: Vec2): Promise<TokenPart> => {
  const wasm = await getManifoldModule();
  const contours: Vec2[][] = [
    [
      [min[0], min[1]],
      [max[0], min[1]],
      [max[0], max[1]],
      [min[0], max[1]],
    ],
  ];

  return {
    colorGroupId: "base",
    manifold: new wasm.CrossSection(contours, "Positive").extrude(1),
  };
};

describe("computePartsBounds", () => {
  it("returns the flat extent covering every part of a token", async () => {
    const upper = { minX: -5, minY: 10, maxX: 5, maxY: 20 };
    const lower = { minX: 0, minY: 0, maxX: 8, maxY: 4 };
    const parts = [
      await buildSquarePart([upper.minX, upper.minY], [upper.maxX, upper.maxY]),
      await buildSquarePart([lower.minX, lower.minY], [lower.maxX, lower.maxY]),
    ];

    expect(computePartsBounds(parts)).toEqual({
      min: [upper.minX, lower.minY],
      max: [lower.maxX, upper.maxY],
    });
  });
});
