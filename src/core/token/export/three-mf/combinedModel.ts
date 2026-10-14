import { resolveColorGroupDisplay } from "../../mesh/colorGroups";
import { TokenPart } from "../../mesh/tokenPart";
import { ColorGroupSpec, Vec2 } from "../../types";
import {
  buildItemXml,
  buildObjectXml,
  colorToDisplayColor,
  escapeXmlAttribute,
  FIRST_OBJECT_ID,
  wrapThreeMfModelXml,
} from "./xml";

export type CombinedThreeMfItem = { parts: TokenPart[]; offsets: Vec2[] };

export const buildCombinedThreeMfModelXml = (
  items: CombinedThreeMfItem[],
  colorGroups: ColorGroupSpec[],
): string => {
  const allParts = items.flatMap((item) => item.parts);

  if (allParts.length === 0) {
    throw new Error("buildCombinedThreeMfModelXml needs at least one TokenPart");
  }

  // One <base> material per distinct colorGroupId, in first-seen order, with its index kept
  // alongside its display name: the object loop below needs both, and every part is guaranteed
  // an entry here because this loop walks that exact same set of parts.
  const materialByColorGroupId = new Map<string, { index: number; name: string }>();
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

  let objectsXml = "";
  let itemsXml = "";
  let nextObjectId = FIRST_OBJECT_ID;

  for (const item of items) {
    for (const part of item.parts) {
      const material = materialByColorGroupId.get(part.colorGroupId);

      if (!material) {
        throw new Error(`No 3MF material registered for color group "${part.colorGroupId}"`);
      }

      const objectId = nextObjectId++;

      objectsXml += buildObjectXml(part, objectId, material.index, material.name);
      itemsXml += item.offsets.map((offset) => buildItemXml(objectId, offset)).join("");
    }
  }

  return wrapThreeMfModelXml(basesXmlParts.join(""), objectsXml, itemsXml);
};
