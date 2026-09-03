import type { Mesh } from "manifold-3d";

const STL_HEADER_BYTES = 80;
const BYTES_PER_TRIANGLE = 50;

type Vec3Tuple = [number, number, number];

const subtractVectors = (a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple => {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
};

const crossProduct = (a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple => {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
};

const normalizeVector = (v: Vec3Tuple): Vec3Tuple => {
  const length = Math.hypot(v[0], v[1], v[2]);

  if (length === 0) {
    return [0, 0, 0];
  }

  return [v[0] / length, v[1] / length, v[2] / length];
};

const triangleNormal = (v0: Vec3Tuple, v1: Vec3Tuple, v2: Vec3Tuple): Vec3Tuple => {
  return normalizeVector(crossProduct(subtractVectors(v1, v0), subtractVectors(v2, v0)));
};

const createBinaryWriter = (buffer: ArrayBuffer) => {
  const view = new DataView(buffer);
  let offset = 0;

  const writeUint32 = (value: number): void => {
    view.setUint32(offset, value, true);
    offset += 4;
  };

  const writeFloat32 = (value: number): void => {
    view.setFloat32(offset, value, true);
    offset += 4;
  };

  const writeUint16 = (value: number): void => {
    view.setUint16(offset, value, true);
    offset += 2;
  };

  const skip = (bytes: number): void => {
    offset += bytes;
  };

  return { writeUint32, writeFloat32, writeUint16, skip };
};

export const meshToStlBinary = (mesh: Mesh): Uint8Array => {
  const triangleCount = mesh.numTri;
  const buffer = new ArrayBuffer(STL_HEADER_BYTES + 4 + triangleCount * BYTES_PER_TRIANGLE);
  const writer = createBinaryWriter(buffer);

  writer.skip(STL_HEADER_BYTES);
  writer.writeUint32(triangleCount);

  const getVertex = (vertexIndex: number): Vec3Tuple => {
    const base = vertexIndex * mesh.numProp;

    return [
      mesh.vertProperties[base],
      mesh.vertProperties[base + 1],
      mesh.vertProperties[base + 2],
    ];
  };

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex++) {
    const v0 = getVertex(mesh.triVerts[triangleIndex * 3]);
    const v1 = getVertex(mesh.triVerts[triangleIndex * 3 + 1]);
    const v2 = getVertex(mesh.triVerts[triangleIndex * 3 + 2]);
    const normal = triangleNormal(v0, v1, v2);

    writer.writeFloat32(normal[0]);
    writer.writeFloat32(normal[1]);
    writer.writeFloat32(normal[2]);

    for (const vertex of [v0, v1, v2]) {
      writer.writeFloat32(vertex[0]);
      writer.writeFloat32(vertex[1]);
      writer.writeFloat32(vertex[2]);
    }

    writer.writeUint16(0);
  }

  return new Uint8Array(buffer);
};
