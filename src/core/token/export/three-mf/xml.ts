import type { Mesh } from "manifold-3d";

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

// offset moves the vertices to their place on the plate.
const buildVerticesXml = (mesh: Mesh, offset: Vec2): string => {
  let verticesXml = "";

  for (let vertexIndex = 0; vertexIndex < mesh.numVert; vertexIndex++) {
    const base = vertexIndex * mesh.numProp;
    const x = mesh.vertProperties[base] + offset[0];
    const y = mesh.vertProperties[base + 1] + offset[1];
    const z = mesh.vertProperties[base + 2];

    verticesXml += `<vertex x="${x}" y="${y}" z="${z}"/>`;
  }

  return verticesXml;
};

// vertexOffset moves the triangle corners onto this volume's vertices in the merged mesh.
// materialXml is empty when the volume uses the object's own material.
const buildTrianglesXml = (mesh: Mesh, vertexOffset: number, materialXml: string): string => {
  let trianglesXml = "";

  for (let triangleIndex = 0; triangleIndex < mesh.numTri; triangleIndex++) {
    const base = triangleIndex * 3;
    const v1 = mesh.triVerts[base] + vertexOffset;
    const v2 = mesh.triVerts[base + 1] + vertexOffset;
    const v3 = mesh.triVerts[base + 2] + vertexOffset;

    trianglesXml += `<triangle v1="${v1}" v2="${v2}" v3="${v3}"${materialXml}/>`;
  }

  return trianglesXml;
};

export type ObjectVolume = { part: TokenPart; materialIndex: number; name: string };

export type VolumeTriangleRange = { name: string; firstTriangleId: number; lastTriangleId: number };

export type MultiVolumeMesh = {
  meshXml: string;
  objectMaterialIndex: number;
  volumeRanges: VolumeTriangleRange[];
};

// One mesh holding every volume back to back, already moved to its place on the plate: PrusaSlicer
// moves only the first volume of an imported multi-part object by its build item transform, so
// nothing can be left to that transform. Its object takes the first volume's material and
// the other volumes tag their own triangles, which is what any 3MF reader colors by. PrusaSlicer
// instead splits the mesh back into parts by the returned triangle ranges (see
// prusaModelConfig.ts), since it flattens <components> into separate objects.
export const buildMultiVolumeMeshXml = (volumes: ObjectVolume[], offset: Vec2): MultiVolumeMesh => {
  const objectMaterialIndex = volumes[0].materialIndex;
  const volumeRanges: VolumeTriangleRange[] = [];
  let verticesXml = "";
  let trianglesXml = "";
  let vertexCount = 0;
  let triangleCount = 0;

  for (const volume of volumes) {
    const mesh = volume.part.manifold.getMesh();
    const usesObjectMaterial = volume.materialIndex === objectMaterialIndex;
    const materialXml = usesObjectMaterial
      ? ""
      : ` pid="${MATERIALS_RESOURCE_ID}" p1="${volume.materialIndex}"`;

    verticesXml += buildVerticesXml(mesh, offset);
    trianglesXml += buildTrianglesXml(mesh, vertexCount, materialXml);

    const firstTriangleId = triangleCount;
    const lastTriangleId = triangleCount + mesh.numTri - 1;

    volumeRanges.push({ name: volume.name, firstTriangleId, lastTriangleId });
    vertexCount += mesh.numVert;
    triangleCount += mesh.numTri;
  }

  const meshXml = `<mesh><vertices>${verticesXml}</vertices><triangles>${trianglesXml}</triangles></mesh>`;

  return { meshXml, objectMaterialIndex, volumeRanges };
};

export const buildMeshObjectXml = (
  objectId: number,
  name: string,
  materialIndex: number,
  meshXml: string,
): string => {
  return (
    `<object id="${objectId}" name="${escapeXmlAttribute(name)}" pid="${MATERIALS_RESOURCE_ID}" pindex="${materialIndex}" type="model">` +
    meshXml +
    `</object>`
  );
};

export const buildItemXml = (objectId: number): string => {
  return `<item objectid="${objectId}"/>`;
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
