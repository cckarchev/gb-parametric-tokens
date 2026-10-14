import { describe, expect, it } from "vitest";

import { getManifoldModule } from "../../mesh/manifoldModule";
import { TokenPart } from "../../mesh/tokenPart";
import { ColorGroupSpec, Vec2 } from "../../types";
import { buildCombinedThreeMfModelXml, CombinedThreeMfItem } from "./combinedModel";

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

const baseGroups: ColorGroupSpec[] = [{ id: "base", name: "Base", color: "#2B2B2B" }];

describe("buildCombinedThreeMfModelXml", () => {
  it("wraps a token's parts in one named object placed by one build item", async () => {
    const items: CombinedThreeMfItem[] = [
      {
        name: "Momentum",
        parts: [await buildBoxPart("base"), await buildBoxPart("text")],
        offsets: [[0, 0]],
      },
    ];
    const colorGroups: ColorGroupSpec[] = [
      ...baseGroups,
      { id: "text", name: "Text", color: "#FFFFFF" },
    ];

    const xml = buildCombinedThreeMfModelXml(items, colorGroups);

    expect(countOccurrences(xml, "<mesh>")).toBe(2);
    expect(countOccurrences(xml, "<component ")).toBe(2);
    expect(xml).toContain('<object id="4" name="Momentum" type="model">');
    expect(countOccurrences(xml, "<item ")).toBe(1);
    expect(xml).toContain('<item objectid="4" ');
  });

  it("numbers each copy as its own object, all sharing the same meshes", async () => {
    const items: CombinedThreeMfItem[] = [
      {
        name: "Knocked Down",
        parts: [await buildBoxPart("base")],
        offsets: [
          [0, 0],
          [30, 0],
          [0, 30],
        ],
      },
    ];

    const xml = buildCombinedThreeMfModelXml(items, baseGroups);

    expect(countOccurrences(xml, "<mesh>")).toBe(1);
    expect(xml).toContain('name="Knocked Down 1"');
    expect(xml).toContain('name="Knocked Down 2"');
    expect(xml).toContain('name="Knocked Down 3"');
    expect(countOccurrences(xml, "<item ")).toBe(3);
    expect(xml).toContain('transform="1 0 0 0 1 0 0 0 1 30 0 0"');
  });

  it("names each mesh after its token and color group", async () => {
    const items: CombinedThreeMfItem[] = [
      { name: "Momentum", parts: [await buildBoxPart("base")], offsets: [[0, 0]] },
    ];

    const xml = buildCombinedThreeMfModelXml(items, baseGroups);

    expect(xml).toContain('name="Momentum (Base)" pid="1" pindex="0"');
  });

  it("deduplicates materials across tokens that share a colorGroupId", async () => {
    const items: CombinedThreeMfItem[] = [
      { name: "A", parts: [await buildBoxPart("base")], offsets: [[0, 0]] },
      { name: "B", parts: [await buildBoxPart("base")], offsets: [[30, 0]] },
    ];

    const xml = buildCombinedThreeMfModelXml(items, baseGroups);

    expect(countOccurrences(xml, "<mesh>")).toBe(2);
    expect(countOccurrences(xml, "<base ")).toBe(1);
    expect(xml).not.toContain('pindex="1"');
  });

  it("keeps colorGroups with different ids as separate materials", async () => {
    const items: CombinedThreeMfItem[] = [
      { name: "A", parts: [await buildBoxPart("base")], offsets: [[0, 0]] },
      { name: "B", parts: [await buildBoxPart("accent")], offsets: [[30, 0]] },
    ];
    const colorGroups: ColorGroupSpec[] = [
      ...baseGroups,
      { id: "accent", name: "Accent", color: "#C9A13B" },
    ];

    const xml = buildCombinedThreeMfModelXml(items, colorGroups);

    expect(countOccurrences(xml, "<base ")).toBe(2);
  });

  it("throws when there are no parts across any item", () => {
    expect(() => buildCombinedThreeMfModelXml([], [])).toThrow(/at least one TokenPart/);
  });
});
