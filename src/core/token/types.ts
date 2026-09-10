export type Vec2 = [number, number];

export type ShapeSpec =
  | {
      type: "arc";
      ribbonWidthMm: number;
      ribbonLengthMm: number;
      nobDiameterMm: number;
      // Smooths the concave corner where the ribbon meets a nob (see geometry/filletOutline.ts).
      // Both optional, undefined behaving as "off", so existing shape literals and imported
      // settings without them keep working unchanged -- same convention as
      // IconSpec.overflowBehavior in this file.
      nobFilletEnabled?: boolean;
      nobFilletRadiusMm?: number;
    }
  | { type: "disc"; diameterMm: number };

export type TextLayout = "arc" | "flat" | "ring";

export type LineSpec = {
  text: string;
  sizeMm: number;
  radiusMm?: number;
  colorGroup?: string;
};

// What to do when an icon's own artwork pokes past its target nob/disc circle:
// - "none" (the default): render it as-is, and flag the token for attention.
// - "shrink": scale the whole icon down further so it fits inside the circle -- see
//   geometry/iconPlacement.ts's placeIcon. No attention flag, since it's already handled.
// - "trim": cut off whatever pokes past the circle instead of shrinking the icon -- see
//   geometry/trimIconToCircle.ts. No attention flag either.
// - "grow": leave the icon itself untouched, and instead grow the nob/disc's own body to hug
//   it -- see geometry/growIconOutline.ts. No attention flag either.
export type IconOverflowBehavior = "none" | "shrink" | "trim" | "grow";

export type IconSpec = {
  iconId: string;
  side: "left" | "right" | "center";
  scale: number;
  colorGroup?: string;
  overflowBehavior?: IconOverflowBehavior;
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
