import { resolveColorGroupDisplay } from "../mesh/colorGroups";
import { TokenPart } from "../mesh/tokenPart";
import { ColorGroupSpec, Vec2 } from "../types";
import {
  buildItemXml,
  buildObjectXml,
  colorToDisplayColor,
  escapeXmlAttribute,
  FIRST_OBJECT_ID,
  wrapThreeMfModelXml,
} from "./threeMfXml";

export type CombinedThreeMfItem = { parts: TokenPart[]; offsets: Vec2[] };

export const buildCombinedThreeMfModelXml = (
  items: CombinedThreeMfItem[],
  colorGroups: ColorGroupSpec[],
): string => {
  const allParts = items.flatMap((item) => item.parts);

  if (allParts.length === 0) {
    throw new Error("buildCombinedThreeMfModelXml needs at least one TokenPart");
  }

  const materialIndexByColorGroupId = new Map<string, number>();
  const basesXmlParts: string[] = [];

  for (const part of allParts) {
    if (materialIndexByColorGroupId.has(part.colorGroupId)) {
      continue;
    }

    const display = resolveColorGroupDisplay(part.colorGroupId, colorGroups);

    materialIndexByColorGroupId.set(part.colorGroupId, basesXmlParts.length);
    basesXmlParts.push(
      `<base name="${escapeXmlAttribute(display.name)}" displaycolor="${colorToDisplayColor(display.color)}"/>`,
    );
  }

  let objectsXml = "";
  let itemsXml = "";
  let nextObjectId = FIRST_OBJECT_ID;

  for (const item of items) {
    for (const part of item.parts) {
      const objectId = nextObjectId++;
      const materialIndex = materialIndexByColorGroupId.get(part.colorGroupId) as number;
      const display = resolveColorGroupDisplay(part.colorGroupId, colorGroups);

      objectsXml += buildObjectXml(part, objectId, materialIndex, display.name);
      itemsXml += item.offsets.map((offset) => buildItemXml(objectId, offset)).join("");
    }
  }

  return wrapThreeMfModelXml(basesXmlParts.join(""), objectsXml, itemsXml);
};
