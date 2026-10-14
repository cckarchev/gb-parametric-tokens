import {
  DEFAULT_ARC_SHAPE,
  DEFAULT_COLOR_GROUPS,
  DEFAULT_DISC_SHAPE,
  DEFAULT_FIT_POLICY,
  DEFAULT_STYLE,
} from "../../defaultShapeAndStyle";
import { FALLBACK_ICON_ID } from "../../icons/iconManifest";
import { DEFAULT_PRINT_PROFILE_ID } from "../../printProfiles";
import { DiscShapeSpec } from "../../types";
import { SharedConfig, TokenTuning } from "./tokenItem";

const DEFAULT_GOAL_INFLUENCE_SHAPE: DiscShapeSpec = {
  type: "disc",
  diameterMm: 20,
};
// Measured against the real DEFAULT_ARC_SHAPE's 6mm band via the real pipeline
// (computeReliefComponents): the largest sizes that fit a two-line label like "Command" /
// "-2/-2 MOV" without truncating or overlapping the ribbon edges.
const DEFAULT_NAME_SIZE_MM = 3;
const DEFAULT_EFFECT_SIZE_MM = 1.9;

// Every value here was a constant in its builder before it became a setting; the comments that
// explain each one (why the crest is 0.55 on the compact disc, why the band is 6mm) still live
// next to where the builder uses it. The insets are the old 0.75 text radius ratio re-expressed as
// a distance from the rim, rounded to 0.1mm.
export const DEFAULT_TOKEN_TUNING: TokenTuning = {
  discToken: { crestScale: 0.85 },
  characterToken: { crestScale: 0.85, balanceNameScale: 0.9, balanceEffectScale: 1.2 },
  ringBadge: { textSizeMm: 2.2, textInsetMm: 1, crestScale: 0.65 },
  momentum: { textSizeMm: 6, ringInsetMm: 0.8, ringWidthMm: 0.6 },
  condition: { iconScale: 0.72 },
  aoe: {
    bandWidthMm: 6,
    ring: { textSizeMm: 3.5 },
    compactDisc: { textSizeMm: 2.6, textInsetMm: 1.4, crestScale: 0.55 },
    crowfoot: {
      spokeCount: 3,
      spokeWidthMm: 5,
      arcSweepDeg: 40,
      cornerRadiusMm: 1.5,
      filletEnabled: true,
      filletRadiusMm: 3,
      textSizeMm: 4,
      spokeTextCenterClearanceMm: 4,
      spokeTextBandMarginMm: 1,
    },
  },
};

export const DEFAULT_SHARED_CONFIG: SharedConfig = {
  arcShape: DEFAULT_ARC_SHAPE,
  discShape: DEFAULT_DISC_SHAPE,
  goalInfluenceShape: DEFAULT_GOAL_INFLUENCE_SHAPE,
  style: DEFAULT_STYLE,
  fitPolicy: DEFAULT_FIT_POLICY,
  printProfileId: DEFAULT_PRINT_PROFILE_ID,
  colorGroups: DEFAULT_COLOR_GROUPS,
  // Stands in only until a guild has loaded; useTokenGenerator overwrites it with that guild's
  // own icon id.
  influenceIconId: FALLBACK_ICON_ID,
  nameSizeMm: DEFAULT_NAME_SIZE_MM,
  effectSizeMm: DEFAULT_EFFECT_SIZE_MM,
  showSecondLine: true,
  balanceTwoLineSizes: false,
  iconOverflowBehavior: "none",
  aoeTemplateVariant: "ring",
  ...DEFAULT_TOKEN_TUNING,
};
