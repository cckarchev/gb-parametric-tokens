import type { TokenSpec } from "./types";

// The smallest valid spec per shape, for tests about the plumbing around a
// spec: no lines, icons or decorations. Tests about a spec's contents build
// their own, so the fields that matter show.
export const discSpec: TokenSpec = {
  version: 1,
  shape: { type: "disc", diameterMm: 25 },
  textLayout: "flat",
  lines: [],
  icons: [],
  decorations: [],
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  colorGroups: [],
  printProfileId: "fdm-04",
  fitPolicy: {
    minTracking: 0,
    maxTracking: 0,
    minScale: 1,
    allowTwoLines: false,
  },
};

export const arcSpec: TokenSpec = {
  version: 1,
  shape: {
    type: "arc",
    ribbonWidthMm: 15,
    ribbonLengthMm: 20,
    studDiameterMm: 24,
  },
  textLayout: "arc",
  lines: [],
  icons: [],
  decorations: [],
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  colorGroups: [],
  printProfileId: "fdm-04",
  fitPolicy: {
    minTracking: 0,
    maxTracking: 0.3,
    minScale: 0.7,
    allowTwoLines: true,
  },
};
