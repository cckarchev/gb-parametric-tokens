import type { ManifoldToplevel } from "manifold-3d";
import Module from "manifold-3d";

let modulePromise: Promise<ManifoldToplevel> | undefined;

export const getManifoldModule = (): Promise<ManifoldToplevel> => {
  if (!modulePromise) {
    modulePromise = Module().then((wasm) => {
      wasm.setup();

      return wasm;
    });
  }

  return modulePromise;
};
