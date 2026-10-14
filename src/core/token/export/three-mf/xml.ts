import type { Manifold } from "manifold-3d";

import { TokenPart } from "../../mesh/tokenPart";
import { Vec2 } from "../../types";

const THREE_MF_MODEL_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";
const MATERIALS_RESOURCE_ID = 1;
export const FIRST_OBJECT_ID = 2;

export const escapeXmlAttribute = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

export const colorToDisplayColor = (colorHex: string): string => `${colorHex}FF`;

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

export const buildObjectXml = (
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

// An object made only of references to mesh objects. A slicer loads it as one object with one
// part per mesh, so a token's base and relief move together but keep their own colors.
export const buildComponentsObjectXml = (
  objectId: number,
  meshObjectIds: number[],
  name: string,
): string => {
  const componentsXml = meshObjectIds
    .map((meshObjectId) => `<component objectid="${meshObjectId}"/>`)
    .join("");

  return (
    `<object id="${objectId}" name="${escapeXmlAttribute(name)}" type="model">` +
    `<components>${componentsXml}</components>` +
    `</object>`
  );
};

export const buildItemXml = (objectId: number, offset: Vec2): string => {
  const transform = `1 0 0 0 1 0 0 0 1 ${offset[0]} ${offset[1]} 0`;

  return `<item objectid="${objectId}" transform="${transform}"/>`;
};

export const wrapThreeMfModelXml = (
  basesXml: string,
  objectsXml: string,
  itemsXml: string,
): string => {
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
