import { ArcShapeSpec, ColorGroupSpec, DiscShapeSpec, FitPolicy, StyleSpec } from "./types";

// The default arc shape, tuned by eye rather than measured. ShapeEditor also falls back to its
// fillet radius for an arc that has none.
export const DEFAULT_ARC_SHAPE: ArcShapeSpec = {
  type: "arc",
  ribbonWidthMm: 6,
  ribbonLengthMm: 30,
  studDiameterMm: 12,
  studFilletEnabled: true,
  studFilletRadiusMm: 3,
};

export const DEFAULT_DISC_SHAPE: DiscShapeSpec = {
  type: "disc",
  diameterMm: 15,
};

export const DEFAULT_STYLE: StyleSpec = {
  relief: "raised",
  reliefHeightMm: 0.6,
  baseThicknessMm: 3,
};

export const DEFAULT_FIT_POLICY: FitPolicy = {
  minTracking: -0.3,
  maxTracking: 0,
  minScale: 0.7,
  allowTwoLines: true,
};

export const DEFAULT_COLOR_GROUPS: ColorGroupSpec[] = [
  { id: "base", name: "Base", color: "#2B2B2B" },
];
