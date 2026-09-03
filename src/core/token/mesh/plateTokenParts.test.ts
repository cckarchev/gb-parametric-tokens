import { describe, expect, it } from "vitest";

import { Vec2 } from "../types";
import { getManifoldModule } from "./manifoldModule";
import { plateTokenParts } from "./plateTokenParts";
import { TokenPart } from "./tokenPart";

const buildBoxPart = async (colorGroupId: string): Promise<TokenPart> => {
  const wasm = await getManifoldModule();
  const contours: Vec2[][] = [
    [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ],
  ];
  const manifold = new wasm.CrossSection(contours, "Positive").extrude(1);

  return { colorGroupId, manifold };
};

describe("plateTokenParts", () => {
  it("returns the same single manifold, just translated, when there is one offset", async () => {
    const part = await buildBoxPart("base");

    const [plated] = plateTokenParts([part], [[10, 0]]);
    const bounds = plated.manifold.boundingBox();

    expect(bounds.min[0]).toBe(10);
    expect(bounds.max[0]).toBe(14);
  });

  it("merges non-overlapping copies into one manifold spanning both", async () => {
    const part = await buildBoxPart("base");

    const [plated] = plateTokenParts(
      [part],
      [
        [0, 0],
        [10, 0],
      ],
    );
    const bounds = plated.manifold.boundingBox();

    expect(bounds.min[0]).toBe(0);
    expect(bounds.max[0]).toBe(14);
    expect(plated.manifold.decompose().length).toBe(2); // copies don't touch, still two solids
  });

  it("plates every part independently, preserving colorGroupId", async () => {
    const parts = [await buildBoxPart("base"), await buildBoxPart("accent")];

    const plated = plateTokenParts(parts, [
      [0, 0],
      [10, 0],
    ]);

    expect(plated.map((part) => part.colorGroupId)).toEqual(["base", "accent"]);
  });
});
