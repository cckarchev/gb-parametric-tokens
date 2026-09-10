import { describe, expect, it } from "vitest";

import { TokenSpec } from "../types";
import { requireDiscShape } from "./computeReliefComponentsShared";

const spec = (shape: TokenSpec["shape"]): TokenSpec => ({
  version: 1,
  shape,
  textLayout: "flat",
  lines: [],
  icons: [],
  decorations: [],
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  colorGroups: [],
  printProfileId: "fdm-04",
  fitPolicy: { minTracking: 0, maxTracking: 0, minScale: 1, allowTwoLines: false },
});

describe("requireDiscShape", () => {
  it("returns the disc shape itself", () => {
    const discShape = { type: "disc", diameterMm: 25 } as const;

    expect(requireDiscShape(spec(discShape), "someCaller")).toEqual(discShape);
  });

  it("names the calling builder in the error, so a thrown stack points at the right layout", () => {
    const arcShape = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 32,
      studDiameterMm: 24,
    } as const;

    expect(() => requireDiscShape(spec(arcShape), "computeRingReliefComponents")).toThrow(
      'computeRingReliefComponents requires a disc shape, got "arc"',
    );
  });
});
