import { describe, expect, it } from "vitest";

import { arcSpec, discSpec } from "../testSpecs";
import { computeFootprintMm } from "./computeFootprintMm";
import { computeEffectiveStudDiameterMm, computeOuterRadiusMm } from "./studPlacement";

describe("computeFootprintMm", () => {
  it("uses the diameter for a disc shape", () => {
    const footprint = computeFootprintMm(discSpec.shape);

    expect(footprint).toEqual({ width: 25, height: 25 });
  });

  it("uses a conservative square bounding box for an arc shape", () => {
    const shape = arcSpec.shape as Extract<typeof arcSpec.shape, { type: "arc" }>;
    const expectedSpanMm =
      (computeOuterRadiusMm(shape) + computeEffectiveStudDiameterMm(shape) / 2) * 2;

    const footprint = computeFootprintMm(arcSpec.shape);

    expect(footprint).toEqual({ width: expectedSpanMm, height: expectedSpanMm });
  });
});
