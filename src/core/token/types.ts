export type Vec2 = [number, number];

export type ShapeSpec =
  | {
      type: "arc";
      ribbonWidthMm: number;
      ribbonLengthMm: number;
      studDiameterMm: number;
      // Rounds the inside corner where the ribbon meets a stud. Optional, so
      // older settings files without it still load; missing means off.
      studFilletEnabled?: boolean;
      studFilletRadiusMm?: number;
    }
  | {
      type: "disc";
      diameterMm: number;
      // Cuts a centered hole of this diameter, leaving a hollow ring (see
      // geometry/discFootprint.ts). Optional, undefined meaning a solid disc,
      // so every existing shape literal and imported setting keeps working
      // unchanged.
      innerDiameterMm?: number;
      // Cuts the ring down to a "crow's foot": short arcs of the band joined to
      // the center by straight spokes, the first one pointing up (see
      // geometry/discFootprint.ts). Optional, undefined meaning the plain disc
      // or ring above.
      crowfoot?: CrowfootSpec;
    };

export type CrowfootSpec = {
  spokeCount: number;
  spokeWidthMm: number;
  // How much of the band each spoke keeps, centered on the spoke.
  arcSweepDeg: number;
  // Rounds the arcs' square ends. Only convex corners: the spokes still meet
  // the arcs sharply.
  cornerRadiusMm: number;
  // Rounds the concave corners, where spokes meet arcs and each other, so they
  // don't snap there.
  filletRadiusMm: number;
};

// The two arms of ShapeSpec on their own, for the many builders that only ever
// handle one of them (mesh/buildArcRibbon.ts,
// catalog/token-items/momentumTokenSpec.ts, and so on).
export type ArcShapeSpec = Extract<ShapeSpec, { type: "arc" }>;
export type DiscShapeSpec = Extract<ShapeSpec, { type: "disc" }>;

type TextLayout = "arc" | "flat" | "ring";

export type LineSpec = {
  text: string;
  sizeMm: number;
  // Arc layout only: a smaller size to try on one line before splitting the
  // text in two, for a line whose preferred sizeMm only suits short text.
  fallbackSizeMm?: number;
  radiusMm?: number;
  // Ring layout only: where along the circle the line is centered. Optional for
  // the first two lines, which default to top and bottom (see
  // relief/computeRingReliefComponents.ts).
  centerAngleDeg?: number;
  // Ring layout only: "arc" (the default) curves the line along the circle at
  // radiusMm; "radial" lays it straight along the spoke at centerAngleDeg,
  // centered radiusMm out.
  placement?: "arc" | "radial";
  colorGroup?: string;
};

// What to do when an icon reaches past its stud or disc:
// - "none": print it as is and flag the token for attention.
// - "shrink": scale the icon down until it fits.
// - "trim": cut off what reaches past the circle.
// - "grow" (the default): grow the stud or disc around the icon.
export type IconOverflowBehavior = "none" | "shrink" | "trim" | "grow";

export type IconSpec = {
  iconId: string;
  side: "left" | "right" | "center";
  scale: number;
  colorGroup?: string;
  overflowBehavior?: IconOverflowBehavior;
};

// "inlay" is flat: each relief color is its own part filling a pocket cut flush
// into the base, so a multicolor printer prints it in another filament without
// raising it.
export type ReliefStyle = "raised" | "engraved" | "inlay";

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

type DecorationSpec = {
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
  // The id of a FONT_CATALOG entry (see fontCatalog.ts). Omitted means the body
  // font.
  fontId?: string;
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
