import { describe, expect, it } from "vitest";

import { getManifoldModule } from "../../mesh/manifoldModule";
import type { TokenPart } from "../../mesh/tokenPart";
import type { ColorGroupSpec, Vec2 } from "../../types";
import {
  buildCombinedThreeMfModel,
  type CombinedThreeMfItem,
} from "./combinedModel";

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

const countOccurrences = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1;

const baseGroups: ColorGroupSpec[] = [
  { id: "base", name: "Base", color: "#2B2B2B" },
];

// Far enough apart that no two 2mm test boxes overlap.
const COPY_SPACING_MM = 30;

describe("buildCombinedThreeMfModel", () => {
  it("merges a token's parts into one named object placed by one build item", async () => {
    const items: CombinedThreeMfItem[] = [
      {
        name: "Momentum",
        parts: [await buildBoxPart("base"), await buildBoxPart("text")],
        offsets: [[0, 0]],
      },
    ];
    const colorGroups: ColorGroupSpec[] = [
      ...baseGroups,
      { id: "text", name: "Details", color: "#FFFFFF" },
    ];

    const { modelXml } = buildCombinedThreeMfModel(items, colorGroups);

    expect(countOccurrences(modelXml, "<object ")).toBe(1);
    expect(countOccurrences(modelXml, "<mesh>")).toBe(1);
    expect(modelXml).toContain(
      '<object id="2" name="Momentum" pid="1" pindex="0" type="model">',
    );
    expect(countOccurrences(modelXml, "<item ")).toBe(1);
    expect(modelXml).toContain('<item objectid="2"/>');
  });

  it("tells PrusaSlicer which triangles are which part, named after their color group", async () => {
    const items: CombinedThreeMfItem[] = [
      {
        name: "Momentum",
        parts: [await buildBoxPart("base"), await buildBoxPart("text")],
        offsets: [[0, 0]],
      },
    ];
    const colorGroups: ColorGroupSpec[] = [
      ...baseGroups,
      { id: "text", name: "Details", color: "#FFFFFF" },
    ];

    const { prusaModelConfigXml } = buildCombinedThreeMfModel(
      items,
      colorGroups,
    );

    expect(prusaModelConfigXml).toContain(
      '<object id="2" instances_count="1">',
    );
    expect(prusaModelConfigXml).toContain('key="name" value="Momentum"');
    expect(countOccurrences(prusaModelConfigXml, "<volume ")).toBe(2);
    expect(prusaModelConfigXml).toContain('value="Base"');
    expect(prusaModelConfigXml).toContain('value="Details"');
  });
});

describe("buildCombinedThreeMfModel copies and materials", () => {
  it("makes every copy its own numbered object, each with its own part ranges", async () => {
    const items: CombinedThreeMfItem[] = [
      {
        name: "Knocked Down",
        parts: [await buildBoxPart("base")],
        offsets: [
          [0, 0],
          [COPY_SPACING_MM, 0],
          [0, COPY_SPACING_MM],
        ],
      },
    ];
    const copyCount = items[0].offsets.length;

    const { modelXml, prusaModelConfigXml } = buildCombinedThreeMfModel(
      items,
      baseGroups,
    );

    expect(countOccurrences(modelXml, "<object ")).toBe(copyCount);
    expect(modelXml).toContain('name="Knocked Down 1"');
    expect(modelXml).toContain('name="Knocked Down 2"');
    expect(modelXml).toContain('name="Knocked Down 3"');
    expect(countOccurrences(modelXml, "<item ")).toBe(copyCount);
    // The second copy's 2mm box sits 30mm to the right, baked into its own
    // vertices.
    expect(modelXml).toContain('<object id="3" name="Knocked Down 2"');
    expect(modelXml).toContain('<vertex x="32" y="2" z="1"/>');
    expect(modelXml).not.toContain("transform=");
    expect(countOccurrences(prusaModelConfigXml, 'instances_count="1"')).toBe(
      copyCount,
    );
    expect(prusaModelConfigXml).toContain('value="Knocked Down 3"');
  });

  it("deduplicates materials across tokens that share a colorGroupId", async () => {
    const items: CombinedThreeMfItem[] = [
      { name: "A", parts: [await buildBoxPart("base")], offsets: [[0, 0]] },
      {
        name: "B",
        parts: [await buildBoxPart("base")],
        offsets: [[COPY_SPACING_MM, 0]],
      },
    ];

    const { modelXml } = buildCombinedThreeMfModel(items, baseGroups);

    expect(countOccurrences(modelXml, "<object ")).toBe(2);
    expect(countOccurrences(modelXml, "<base ")).toBe(1);
    expect(modelXml).not.toContain('pindex="1"');
  });
});

describe("buildCombinedThreeMfModel separate materials", () => {
  it("keeps colorGroups with different ids as separate materials", async () => {
    const items: CombinedThreeMfItem[] = [
      { name: "A", parts: [await buildBoxPart("base")], offsets: [[0, 0]] },
      {
        name: "B",
        parts: [await buildBoxPart("accent")],
        offsets: [[COPY_SPACING_MM, 0]],
      },
    ];
    const colorGroups: ColorGroupSpec[] = [
      ...baseGroups,
      { id: "accent", name: "Accent", color: "#C9A13B" },
    ];

    const { modelXml } = buildCombinedThreeMfModel(items, colorGroups);

    expect(countOccurrences(modelXml, "<base ")).toBe(2);
  });

  it("throws when there are no parts across any item", () => {
    expect(() => buildCombinedThreeMfModel([], [])).toThrow(
      /at least one TokenPart/,
    );
  });
});
