import { describe, expect, it } from "vitest";

import { getManifoldModule } from "./manifoldModule";

describe("getManifoldModule", () => {
  it("resolves a module that can build a unit cube", async () => {
    const wasm = await getManifoldModule();
    const cube = wasm.Manifold.cube([1, 1, 1], false);

    // Six faces, two triangles each.
    const cubeTriangleCount = 12;

    expect(cube.getMesh().numTri).toBe(cubeTriangleCount);
  });

  it("memoizes the module across calls", async () => {
    const first = await getManifoldModule();
    const second = await getManifoldModule();

    expect(first).toBe(second);
  });
});
