import { resolveColorGroupDisplay } from "../mesh/colorGroups";
import { TokenPart } from "../mesh/tokenPart";
import { ColorGroupSpec, Vec2 } from "../types";

const THREE_MF_MODEL_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";
const MATERIALS_RESOURCE_ID = 1;
const FIRST_OBJECT_ID = 2;

const escapeXmlAttribute = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const colorToDisplayColor = (colorHex: string): string => `${colorHex}FF`;

const buildVerticesXml = (part: TokenPart): string => {
  const mesh = part.manifold.getMesh();
  let verticesXml = "";

  for (let vertexIndex = 0; vertexIndex < mesh.numVert; vertexIndex++) {
    const base = vertexIndex * mesh.numProp;

    verticesXml += `<vertex x="${mesh.vertProperties[base]}" y="${mesh.vertProperties[base + 1]}" z="${mesh.vertProperties[base + 2]}"/>`;
  }

  return verticesXml;
};

const buildTrianglesXml = (part: TokenPart): string => {
  const mesh = part.manifold.getMesh();
  let trianglesXml = "";

  for (let triangleIndex = 0; triangleIndex < mesh.numTri; triangleIndex++) {
    const base = triangleIndex * 3;

    trianglesXml += `<triangle v1="${mesh.triVerts[base]}" v2="${mesh.triVerts[base + 1]}" v3="${mesh.triVerts[base + 2]}"/>`;
  }

  return trianglesXml;
};

const buildObjectXml = (
  part: TokenPart,
  objectId: number,
  materialIndex: number,
  displayName: string,
): string => {
  return (
    `<object id="${objectId}" name="${escapeXmlAttribute(displayName)}" pid="${MATERIALS_RESOURCE_ID}" pindex="${materialIndex}" type="model">` +
    `<mesh><vertices>${buildVerticesXml(part)}</vertices><triangles>${buildTrianglesXml(part)}</triangles></mesh>` +
    `</object>`
  );
};

const buildItemXml = (objectId: number, offset: Vec2): string => {
  const transform = `1 0 0 0 1 0 0 0 1 ${offset[0]} ${offset[1]} 0`;

  return `<item objectid="${objectId}" transform="${transform}"/>`;
};

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

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<model unit="millimeter" xmlns="${THREE_MF_MODEL_NAMESPACE}">` +
    `<resources>` +
    `<basematerials id="${MATERIALS_RESOURCE_ID}">${basesXmlParts.join("")}</basematerials>` +
    objectsXml +
    `</resources>` +
    `<build>${itemsXml}</build>` +
    `</model>`
  );
};
