import { DiscShapeSpec } from "../../geometry/studPlacement";
import { FitPolicy, TokenSpec } from "../../types";
import { TEXT_COLOR_GROUP_ID } from "../deriveReliefColor";
import { SharedConfig } from "./tokenItem";
import { sharedTokenFields } from "./tokenSpecParts";

// "MP" (Momentum Points) is the text printed on the Momentum token itself -- not a separate
// token kind, see [[batch-grid-and-tokens-2026-09-02]].
const MOMENTUM_TEXT = "MP";
const MOMENTUM_TEXT_SIZE_MM = 6;
const MOMENTUM_FIT_POLICY: FitPolicy = {
  minTracking: 0,
  maxTracking: 0,
  minScale: 1,
  allowTwoLines: false,
};

// Not physically calibrated (see arc-ribbon-parametrization's precedent for this project's
// disc/arc shape defaults): a starting point for a thin border ring, proportional to the disc's
// own diameter so it tracks that shape's default if it ever changes -- tune by feel / real
// render, same as every other geometry default in this app.
const RING_RADIUS_RATIO = 0.85;
const RING_WIDTH_MM = 0.6;

const buildRingDecoration = (discShape: DiscShapeSpec) => {
  const radiusMm = (discShape.diameterMm / 2) * RING_RADIUS_RATIO;

  return {
    type: "ring" as const,
    radiusMm,
    widthMm: RING_WIDTH_MM,
    colorGroup: TEXT_COLOR_GROUP_ID,
  };
};

// Fixed text "MP" (Momentum Points) plus a thin border ring, no icon -- a physical chip you
// stack to count Momentum, not a token that reads its own numeric value.
export const buildMomentumTokenSpec = (sharedConfig: SharedConfig): TokenSpec => {
  return {
    version: 1,
    shape: sharedConfig.discShape,
    textLayout: "flat",
    lines: [
      { text: MOMENTUM_TEXT, sizeMm: MOMENTUM_TEXT_SIZE_MM, colorGroup: TEXT_COLOR_GROUP_ID },
    ],
    icons: [],
    decorations: [buildRingDecoration(sharedConfig.discShape)],
    ...sharedTokenFields(sharedConfig),
    fitPolicy: MOMENTUM_FIT_POLICY,
  };
};
