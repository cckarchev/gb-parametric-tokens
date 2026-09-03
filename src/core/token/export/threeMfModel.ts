import type { Manifold } from "manifold-3d";

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

const buildVerticesXml = (manifold: Manifold): string => {
  const mesh = manifold.getMesh();
  let verticesXml = "";

  for (let vertexIndex = 0; vertexIndex < mesh.numVert; vertexIndex++) {
    const base = vertexIndex * mesh.numProp;

    verticesXml += `<vertex x="${mesh.vertProperties[base]}" y="${mesh.vertProperties[base + 1]}" z="${mesh.vertProperties[base + 2]}"/>`;
  }

  return verticesXml;
};

const buildTrianglesXml = (manifold: Manifold): string => {
  const mesh = manifold.getMesh();
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
    `<mesh><vertices>${buildVerticesXml(part.manifold)}</vertices><triangles>${buildTrianglesXml(part.manifold)}</triangles></mesh>` +
    `</object>`
  );
};

const buildItemXml = (objectId: number, offset: Vec2): string => {
  const transform = `1 0 0 0 1 0 0 0 1 ${offset[0]} ${offset[1]} 0`;

  return `<item objectid="${objectId}" transform="${transform}"/>`;
};

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
