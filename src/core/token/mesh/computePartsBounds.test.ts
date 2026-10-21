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
    const parts = [
      await buildSquarePart([-5, 10], [5, 20]),
      await buildSquarePart([0, 0], [8, 4]),
    ];

    expect(computePartsBounds(parts)).toEqual({ min: [-5, 0], max: [8, 20] });
  });
});
