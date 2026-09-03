import { describe, expect, it } from "vitest";

import { getManifoldModule } from "../mesh/manifoldModule";
import { meshToStlBinary } from "./stlBinary";

const STL_HEADER_BYTES = 80;
const BYTES_PER_TRIANGLE = 50;

describe("meshToStlBinary", () => {
  it("produces a buffer of exactly header + count + 50 bytes per triangle", async () => {
    const wasm = await getManifoldModule();
    const mesh = wasm.Manifold.cube([1, 1, 1], false).getMesh();

    const buffer = meshToStlBinary(mesh);

    expect(buffer.byteLength).toBe(STL_HEADER_BYTES + 4 + mesh.numTri * BYTES_PER_TRIANGLE);
  });

  it("writes the triangle count as a little-endian uint32 right after the header", async () => {
    const wasm = await getManifoldModule();
    const mesh = wasm.Manifold.cube([1, 1, 1], false).getMesh();

    const buffer = meshToStlBinary(mesh);
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    expect(view.getUint32(STL_HEADER_BYTES, true)).toBe(mesh.numTri);
    expect(mesh.numTri).toBe(12);
  });

  it("writes a unit-length normal for every triangle", async () => {
    const wasm = await getManifoldModule();
    const mesh = wasm.Manifold.cube([1, 1, 1], false).getMesh();

    const buffer = meshToStlBinary(mesh);
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    for (let triangleIndex = 0; triangleIndex < mesh.numTri; triangleIndex++) {
      const triangleOffset = STL_HEADER_BYTES + 4 + triangleIndex * BYTES_PER_TRIANGLE;
      const nx = view.getFloat32(triangleOffset, true);
      const ny = view.getFloat32(triangleOffset + 4, true);
      const nz = view.getFloat32(triangleOffset + 8, true);
      const length = Math.hypot(nx, ny, nz);

      expect(length).toBeCloseTo(1, 5);
    }
  });
});
