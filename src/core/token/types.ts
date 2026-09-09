export type Vec2 = [number, number];

export type ShapeSpec =
  | { type: "arc"; ribbonWidthMm: number; ribbonLengthMm: number; nobDiameterMm: number }
  | { type: "disc"; diameterMm: number };

export type TextLayout = "arc" | "flat" | "ring";

export type LineSpec = {
  text: string;
  sizeMm: number;
  radiusMm?: number;
  colorGroup?: string;
};

export type IconSpec = {
  iconId: string;
  side: "left" | "right" | "center";
  scale: number;
  colorGroup?: string;
  // Off (undefined/false) by default: an icon whose own artwork pokes past its target nob/disc
  // circle is still flagged for attention either way (see geometry/iconPlacement.ts), but only
  // shrunk further to fit when this is on.
  constrainToCircle?: boolean;
};

export type ReliefStyle = "raised" | "engraved";

export type StyleSpec = {
  relief: ReliefStyle;
  reliefHeightMm: number;
  baseThicknessMm: number;
};

export type ColorGroupSpec = {
  id: string;
  name: string;
  color: string;
};

export type DecorationSpec = {
  type: "ring";
  radiusMm: number;
  widthMm: number;
  colorGroup?: string;
};

export type FitPolicy = {
  minTracking: number;
  maxTracking: number;
  minScale: number;
  allowTwoLines: boolean;
};

export type TokenSpec = {
  version: 1;
  shape: ShapeSpec;
  textLayout: TextLayout;
  lines: LineSpec[];
  icons: IconSpec[];
  decorations: DecorationSpec[];
  style: StyleSpec;
  colorGroups: ColorGroupSpec[];
  printProfileId: string;
  fitPolicy: FitPolicy;
};

export type PrintProfile = {
  id: string;
  name: string;
  minStrokeWidthMm: number;
  minReliefHeightMm: number;
  minFeatureGapMm: number;
  bezierToleranceMm: number;
  defaultRelief: ReliefStyle;
};
