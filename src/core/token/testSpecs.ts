import { TokenSpec } from "./types";

// Minimal valid specs, one per shape arm, for tests whose subject is the dispatch or the plumbing
// around a spec rather than anything inside it: no lines, no icons, no decorations, so nothing in
// the geometry pipeline runs beyond building the bare base.
//
// Tests that do care about what a spec contains build their own instead, since spelling the
// interesting fields out at the call site is what makes those tests readable.
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
  fitPolicy: { minTracking: 0, maxTracking: 0, minScale: 1, allowTwoLines: false },
};

export const arcSpec: TokenSpec = {
  version: 1,
  shape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, studDiameterMm: 24 },
  textLayout: "arc",
  lines: [],
  icons: [],
  decorations: [],
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  colorGroups: [],
  printProfileId: "fdm-04",
  fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
};
