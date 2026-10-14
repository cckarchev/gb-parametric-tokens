import { resolveColorGroupDisplay } from "../../mesh/colorGroups";
import { TokenPart } from "../../mesh/tokenPart";
import { ColorGroupSpec, Vec2 } from "../../types";
import { buildPrusaModelConfigXml, PrusaObjectConfig } from "./prusaModelConfig";
import {
  buildItemXml,
  buildMeshObjectXml,
  buildMultiVolumeMeshXml,
  colorToDisplayColor,
  escapeXmlAttribute,
  FIRST_OBJECT_ID,
  ObjectVolume,
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

// Every copy of a token is its own object, whose single mesh holds all of the token's color parts.
// Slicers list each copy by name, move its base and relief together, and keep each part's own
// material. Copies are separate objects rather than instances of one: PrusaSlicer only applies a
// multi-part object's part ranges to its first instance and fuses the others into one part.
export const buildCombinedThreeMfModel = (
  items: CombinedThreeMfItem[],
  colorGroups: ColorGroupSpec[],
): { modelXml: string; prusaModelConfigXml: string } => {
  const allParts = items.flatMap((item) => item.parts);

  if (allParts.length === 0) {
    throw new Error("buildCombinedThreeMfModel needs at least one TokenPart");
  }

  const { materialByColorGroupId, basesXml } = collectMaterials(allParts, colorGroups);

  let objectsXml = "";
  let itemsXml = "";
  const prusaObjects: PrusaObjectConfig[] = [];
  let nextObjectId = FIRST_OBJECT_ID;

  for (const item of items) {
    const volumes: ObjectVolume[] = item.parts.map((part) => {
      const material = materialByColorGroupId.get(part.colorGroupId);

      if (!material) {
        throw new Error(`No 3MF material registered for color group "${part.colorGroupId}"`);
      }

      return { part, materialIndex: material.index, name: material.name };
    });

    item.offsets.forEach((offset, copyIndex) => {
      const objectId = nextObjectId++;
      const name = copyName(item.name, copyIndex, item.offsets.length);
      const { meshXml, objectMaterialIndex, volumeRanges } = buildMultiVolumeMeshXml(
        volumes,
        offset,
      );

      objectsXml += buildMeshObjectXml(objectId, name, objectMaterialIndex, meshXml);
      itemsXml += buildItemXml(objectId);
      prusaObjects.push({ objectId, name, volumeRanges });
    });
  }

  return {
    modelXml: wrapThreeMfModelXml(basesXml, objectsXml, itemsXml),
    prusaModelConfigXml: buildPrusaModelConfigXml(prusaObjects),
  };
};
