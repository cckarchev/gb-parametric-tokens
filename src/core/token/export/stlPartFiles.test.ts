import { describe, expect, it } from "vitest";

import { getManifoldModule } from "../mesh/manifoldModule";
import { TokenPart } from "../mesh/tokenPart";
import { ColorGroupSpec, Vec2 } from "../types";
import { buildStlPartFiles } from "./stlPartFiles";

const buildBoxPart = async (colorGroupId: string): Promise<TokenPart> => {
  const wasm = await getManifoldModule();
  const contours: Vec2[][] = [
    [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ],
  ];
  const manifold = new wasm.CrossSection(contours, "Positive").extrude(1);

  return { colorGroupId, manifold };
};

describe("buildStlPartFiles", () => {
  it("names a single part after baseFileName with no suffix", async () => {
    const part = await buildBoxPart("base");
    const files = buildStlPartFiles([part], [], "m4-token");

    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("m4-token.stl");
    expect(files[0].buffer.byteLength).toBeGreaterThan(0);
  });

  it("suffixes each file with a slug of the colorGroup's display name when there is more than one part", async () => {
    const colorGroups: ColorGroupSpec[] = [
      { id: "base", name: "Base", color: "#2B2B2B" },
      { id: "accent", name: "Accent Gold", color: "#C9A13B" },
    ];
    const parts = [await buildBoxPart("base"), await buildBoxPart("accent")];
    const files = buildStlPartFiles(parts, colorGroups, "m4-token");

    expect(files.map((file) => file.fileName)).toEqual([
      "m4-token-base.stl",
      "m4-token-accent-gold.stl",
    ]);
  });

  it("falls back to the raw colorGroupId when it has no matching entry in colorGroups", async () => {
    const parts = [await buildBoxPart("base"), await buildBoxPart("mystery")];
    const files = buildStlPartFiles(parts, [], "m4-token");

    expect(files.map((file) => file.fileName)).toEqual([
      "m4-token-base.stl",
      "m4-token-mystery.stl",
    ]);
  });
});
