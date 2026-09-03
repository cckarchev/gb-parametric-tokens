import { describe, expect, it } from "vitest";

import { getManifoldModule } from "../mesh/manifoldModule";
import { TokenPart } from "../mesh/tokenPart";
import { ColorGroupSpec, Vec2 } from "../types";
import { buildThreeMfModelXml } from "./threeMfModel";

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

const countOccurrences = (haystack: string, needle: string): number => {
  return haystack.split(needle).length - 1;
};

describe("buildThreeMfModelXml", () => {
  it("emits one object, one base material, and one item for a single part", async () => {
    const part = await buildBoxPart("base");
    const colorGroups: ColorGroupSpec[] = [{ id: "base", name: "Base", color: "#2B2B2B" }];

    const xml = buildThreeMfModelXml([part], colorGroups);

    expect(countOccurrences(xml, "<object ")).toBe(1);
    expect(countOccurrences(xml, "<base ")).toBe(1);
    expect(countOccurrences(xml, "<item ")).toBe(1);
    expect(xml).toContain('pid="1" pindex="0"');
    expect(xml).toContain('displaycolor="#2B2B2BFF"');
  });

  it("emits one object/material pair per part, indexed in order", async () => {
    const parts = [await buildBoxPart("base"), await buildBoxPart("accent")];
    const colorGroups: ColorGroupSpec[] = [
      { id: "base", name: "Base", color: "#2B2B2B" },
      { id: "accent", name: "Accent", color: "#C9A13B" },
    ];

    const xml = buildThreeMfModelXml(parts, colorGroups);

    expect(countOccurrences(xml, "<object ")).toBe(2);
    expect(countOccurrences(xml, "<base ")).toBe(2);
    expect(xml).toContain('pid="1" pindex="0"');
    expect(xml).toContain('pid="1" pindex="1"');
    expect(xml).toContain('id="2"');
    expect(xml).toContain('id="3"');
  });

  it("writes every vertex and triangle from the part's mesh", async () => {
    const part = await buildBoxPart("base");
    const mesh = part.manifold.getMesh();

    const xml = buildThreeMfModelXml([part], []);

    expect(countOccurrences(xml, "<vertex ")).toBe(mesh.numVert);
    expect(countOccurrences(xml, "<triangle ")).toBe(mesh.numTri);
  });

  it("escapes XML-unsafe characters in colorGroup names", async () => {
    const part = await buildBoxPart("base");
    const colorGroups: ColorGroupSpec[] = [
      { id: "base", name: 'Q&A "Special" <thing>', color: "#000000" },
    ];

    const xml = buildThreeMfModelXml([part], colorGroups);

    expect(xml).toContain("Q&amp;A &quot;Special&quot; &lt;thing&gt;");
    expect(xml).not.toContain('name="Q&A');
  });

  it("throws when there are no parts", () => {
    expect(() => buildThreeMfModelXml([], [])).toThrow(/at least one TokenPart/);
  });

  it("emits one item per plate offset for each part, all referencing the same object", async () => {
    const part = await buildBoxPart("base");
    const colorGroups: ColorGroupSpec[] = [{ id: "base", name: "Base", color: "#2B2B2B" }];
    const plateOffsets: Vec2[] = [
      [0, 0],
      [50, 0],
      [0, 50],
    ];

    const xml = buildThreeMfModelXml([part], colorGroups, plateOffsets);

    expect(countOccurrences(xml, "<object ")).toBe(1); // geometry defined once
    expect(countOccurrences(xml, "<item ")).toBe(3); // instanced three times
    expect(xml).toContain('transform="1 0 0 0 1 0 0 0 1 50 0 0"');
    expect(xml).toContain('transform="1 0 0 0 1 0 0 0 1 0 50 0"');
  });
});
