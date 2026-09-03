import { resolveColorGroupDisplay } from "../mesh/colorGroups";
import { TokenPart } from "../mesh/tokenPart";
import { ColorGroupSpec, Vec2 } from "../types";
import {
  buildItemXml,
  buildObjectXml,
  colorToDisplayColor,
  escapeXmlAttribute,
  FIRST_OBJECT_ID,
  MATERIALS_RESOURCE_ID,
  THREE_MF_MODEL_NAMESPACE,
} from "./threeMfXml";

export const buildThreeMfModelXml = (
  parts: TokenPart[],
  colorGroups: ColorGroupSpec[],
  plateOffsets: Vec2[] = [[0, 0]],
): string => {
  if (parts.length === 0) {
    throw new Error("buildThreeMfModelXml needs at least one TokenPart");
  }

  const displays = parts.map((part) => resolveColorGroupDisplay(part.colorGroupId, colorGroups));

  const basesXml = displays
    .map(
      (display) =>
        `<base name="${escapeXmlAttribute(display.name)}" displaycolor="${colorToDisplayColor(display.color)}"/>`,
    )
    .join("");

  const objectsXml = parts
    .map((part, index) =>
      buildObjectXml(part, FIRST_OBJECT_ID + index, index, displays[index].name),
    )
    .join("");

  const itemsXml = parts
    .flatMap((_, partIndex) =>
      plateOffsets.map((offset) => buildItemXml(FIRST_OBJECT_ID + partIndex, offset)),
    )
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<model unit="millimeter" xmlns="${THREE_MF_MODEL_NAMESPACE}">` +
    `<resources>` +
    `<basematerials id="${MATERIALS_RESOURCE_ID}">${basesXml}</basematerials>` +
    objectsXml +
    `</resources>` +
    `<build>${itemsXml}</build>` +
    `</model>`
  );
};
