import { describe, expect, it } from "vitest";

import { getManifoldModule } from "../mesh/manifoldModule";
import { TokenPart } from "../mesh/tokenPart";
import { ColorGroupSpec, Vec2 } from "../types";
import { buildCombinedThreeMfModelXml, CombinedThreeMfItem } from "./combinedThreeMfModel";

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

describe("buildCombinedThreeMfModelXml", () => {
  it("emits one object and one item for a single item with one part and one copy", async () => {
    const items: CombinedThreeMfItem[] = [
      { parts: [await buildBoxPart("base")], offsets: [[0, 0]] },
    ];
    const colorGroups: ColorGroupSpec[] = [{ id: "base", name: "Base", color: "#2B2B2B" }];

    const xml = buildCombinedThreeMfModelXml(items, colorGroups);

    expect(countOccurrences(xml, "<object ")).toBe(1);
    expect(countOccurrences(xml, "<base ")).toBe(1);
    expect(countOccurrences(xml, "<item ")).toBe(1);
  });

  it("emits one item per offset for an item with multiple copies, referencing the same object", async () => {
    const items: CombinedThreeMfItem[] = [
      {
        parts: [await buildBoxPart("base")],
        offsets: [
          [0, 0],
          [30, 0],
          [0, 30],
        ],
      },
    ];
    const colorGroups: ColorGroupSpec[] = [{ id: "base", name: "Base", color: "#2B2B2B" }];

    const xml = buildCombinedThreeMfModelXml(items, colorGroups);

    expect(countOccurrences(xml, "<object ")).toBe(1);
    expect(countOccurrences(xml, "<item ")).toBe(3);
    expect(xml).toContain('transform="1 0 0 0 1 0 0 0 1 30 0 0"');
  });

  it("emits a distinct object per distinct token item, even when they share a colorGroupId", async () => {
    const items: CombinedThreeMfItem[] = [
      { parts: [await buildBoxPart("base")], offsets: [[0, 0]] },
      { parts: [await buildBoxPart("base")], offsets: [[30, 0]] },
    ];
    const colorGroups: ColorGroupSpec[] = [{ id: "base", name: "Base", color: "#2B2B2B" }];

    const xml = buildCombinedThreeMfModelXml(items, colorGroups);

    expect(countOccurrences(xml, "<object ")).toBe(2);
    expect(countOccurrences(xml, "<base ")).toBe(1); // deduplicated: one material for both objects
    expect(xml).toContain('pid="1" pindex="0"');
    expect(xml).not.toContain('pindex="1"');
  });

  it("keeps colorGroups with different ids as separate materials", async () => {
    const items: CombinedThreeMfItem[] = [
      { parts: [await buildBoxPart("base")], offsets: [[0, 0]] },
      { parts: [await buildBoxPart("accent")], offsets: [[30, 0]] },
    ];
    const colorGroups: ColorGroupSpec[] = [
      { id: "base", name: "Base", color: "#2B2B2B" },
      { id: "accent", name: "Accent", color: "#C9A13B" },
    ];

    const xml = buildCombinedThreeMfModelXml(items, colorGroups);

    expect(countOccurrences(xml, "<base ")).toBe(2);
  });

  it("throws when there are no parts across any item", () => {
    expect(() => buildCombinedThreeMfModelXml([], [])).toThrow(/at least one TokenPart/);
  });
});
