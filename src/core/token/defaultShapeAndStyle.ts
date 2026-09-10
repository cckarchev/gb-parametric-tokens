import { ArcShapeSpec, DiscShapeSpec } from "./geometry/studPlacement";
import { ColorGroupSpec, FitPolicy, StyleSpec } from "./types";

// Starting point for the fixed-innerR arc model (see
// docs/superpowers/specs/2026-09-02-arc-parametrization-design.md) -- not a physical
// measurement, the user adjusts these by feel. Shared by every flow that needs a starting
// shape (the token editor and ShapeEditor's type-switch default).
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
