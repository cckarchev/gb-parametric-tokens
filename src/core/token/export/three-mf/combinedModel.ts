import { resolveColorGroupDisplay } from "../../mesh/colorGroups";
import { TokenPart } from "../../mesh/tokenPart";
import { ColorGroupSpec, Vec2 } from "../../types";
import {
  buildComponentsObjectXml,
  buildItemXml,
  buildObjectXml,
  colorToDisplayColor,
  escapeXmlAttribute,
  FIRST_OBJECT_ID,
  wrapThreeMfModelXml,
} from "./xml";

export type CombinedThreeMfItem = { name: string; parts: TokenPart[]; offsets: Vec2[] };

type Material = { index: number; name: string };

// A lone copy keeps the token's name; several get numbered so the slicer's object list tells
// them apart.
const copyName = (itemName: string, copyIndex: number, copyCount: number): string => {
  if (copyCount === 1) {
    return itemName;
  }

  const copyNumber = copyIndex + 1;

  return `${itemName} ${copyNumber}`;
};

// One <base> material per distinct colorGroupId, in first-seen order, with its index kept
// alongside its display name.
const collectMaterials = (allParts: TokenPart[], colorGroups: ColorGroupSpec[]) => {
  const materialByColorGroupId = new Map<string, Material>();
  const basesXmlParts: string[] = [];

  for (const part of allParts) {
    if (materialByColorGroupId.has(part.colorGroupId)) {
      continue;
    }

    const display = resolveColorGroupDisplay(part.colorGroupId, colorGroups);

    materialByColorGroupId.set(part.colorGroupId, {
      index: basesXmlParts.length,
      name: display.name,
    });
    basesXmlParts.push(
      `<base name="${escapeXmlAttribute(display.name)}" displaycolor="${colorToDisplayColor(display.color)}"/>`,
    );
  }

  return { materialByColorGroupId, basesXml: basesXmlParts.join("") };
};

// Every copy of a token is its own object, built from components that point at the token's
// shared meshes (one per color group). A slicer then lists each copy by name and moves its base
// and relief together, while each part keeps its own material.
export const buildCombinedThreeMfModelXml = (
  items: CombinedThreeMfItem[],
  colorGroups: ColorGroupSpec[],
): string => {
  const allParts = items.flatMap((item) => item.parts);

  if (allParts.length === 0) {
    throw new Error("buildCombinedThreeMfModelXml needs at least one TokenPart");
  }

  const { materialByColorGroupId, basesXml } = collectMaterials(allParts, colorGroups);

  let objectsXml = "";
  let itemsXml = "";
  let nextObjectId = FIRST_OBJECT_ID;

  for (const item of items) {
    const meshObjectIds: number[] = [];

    for (const part of item.parts) {
      const material = materialByColorGroupId.get(part.colorGroupId);

      if (!material) {
        throw new Error(`No 3MF material registered for color group "${part.colorGroupId}"`);
      }

      const meshObjectId = nextObjectId++;
      const meshName = `${item.name} (${material.name})`;

      objectsXml += buildObjectXml(part, meshObjectId, material.index, meshName);
      meshObjectIds.push(meshObjectId);
    }

    item.offsets.forEach((offset, copyIndex) => {
      const copyObjectId = nextObjectId++;
      const name = copyName(item.name, copyIndex, item.offsets.length);

      objectsXml += buildComponentsObjectXml(copyObjectId, meshObjectIds, name);
      itemsXml += buildItemXml(copyObjectId, offset);
    });
  }

  return wrapThreeMfModelXml(basesXml, objectsXml, itemsXml);
};
