import { DiscShapeSpec, FitPolicy, TokenSpec } from "../../types";
import { TEXT_COLOR_GROUP_ID } from "../deriveReliefColor";
import { MomentumTuning, SharedConfig } from "./tokenItem";
import { sharedTokenFields } from "./tokenSpecParts";

// "MP" (Momentum Points) is the text printed on the Momentum token itself, not a separate token
// kind: there is no "MP token" in the catalog, only this one.
const MOMENTUM_TEXT = "MP";
// "MP" is fixed and two characters long, so it always fits: no tracking, no shrinking, no wrap.
// This replaces the shared fitPolicy rather than adjusting it (see sharedTokenFields).
const MOMENTUM_FIT_POLICY: FitPolicy = {
  minTracking: 0,
  maxTracking: 0,
  minScale: 1,
  allowTwoLines: false,
};

// A thin border ring whose outer edge sits ringInsetMm in from the rim. The ring decoration's
// radiusMm is its centerline, hence the half width.
const buildRingDecoration = (discShape: DiscShapeSpec, tuning: MomentumTuning) => {
  const discRadiusMm = discShape.diameterMm / 2;
  const radiusMm = discRadiusMm - tuning.ringInsetMm - tuning.ringWidthMm / 2;

  return {
    type: "ring" as const,
    radiusMm,
    widthMm: tuning.ringWidthMm,
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
      {
        text: MOMENTUM_TEXT,
        sizeMm: sharedConfig.momentum.textSizeMm,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
    ],
    icons: [],
    decorations: [buildRingDecoration(sharedConfig.discShape, sharedConfig.momentum)],
    ...sharedTokenFields(sharedConfig, MOMENTUM_FIT_POLICY),
  };
};
