import { estimateAscentMm } from "../../text/glyphMetrics";
import { DiscShapeSpec, TokenSpec } from "../../types";
import { CatalogAoeTemplate } from "../catalogTypes";
import { TEXT_COLOR_GROUP_ID } from "../deriveReliefColor";
import { SharedConfig } from "./tokenItem";
import { sharedTokenFields } from "./tokenSpecParts";

const MM_PER_INCH = 25.4;
const AOE_DIAMETER_INCHES = 3;
const AOE_OUTER_DIAMETER_MM = AOE_DIAMETER_INCHES * MM_PER_INCH;
// Wide enough to carry readable curved text, narrow enough that models stand on the
// table inside the ring instead of tilting on top of it.
const AOE_BAND_WIDTH_MM = 6;
const AOE_INNER_DIAMETER_MM = AOE_OUTER_DIAMETER_MM - AOE_BAND_WIDTH_MM * 2;
// Starting point, tuned against a real render like every other typography default here.
const AOE_TEXT_SIZE_MM = 3.5;

// A 3″ AOE is a game object of fixed size, so nothing here reads SharedConfig's shapes: only
// relief, thickness, print profile, and colors come from the shared config. No guild crest: a
// crest fitted to the band came out around 5mm, too small to print its detail (user's call to
// drop it rather than widen the band or bulge it).
const AOE_SHAPE: DiscShapeSpec = {
  type: "disc",
  diameterMm: AOE_OUTER_DIAMETER_MM,
  innerDiameterMm: AOE_INNER_DIAMETER_MM,
};

export const buildAoeTemplateSpec = (
  template: CatalogAoeTemplate,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const bandMidRadiusMm = (AOE_OUTER_DIAMETER_MM + AOE_INNER_DIAMETER_MM) / 4;
  const halfAscentMm = estimateAscentMm(AOE_TEXT_SIZE_MM) / 2;
  // The top line reads outward, so its ink grows past its radius; the bottom line reads inward,
  // so its ink grows back toward center (see ringTokenSpec.ts). Offsetting each by half an
  // ascent centers both lines' ink on the band.
  const topTextRadiusMm = bandMidRadiusMm - halfAscentMm;
  const bottomTextRadiusMm = bandMidRadiusMm + halfAscentMm;

  return {
    version: 1,
    shape: AOE_SHAPE,
    textLayout: "ring",
    lines: [
      {
        text: template.name,
        sizeMm: AOE_TEXT_SIZE_MM,
        radiusMm: topTextRadiusMm,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
      {
        text: template.effect,
        sizeMm: AOE_TEXT_SIZE_MM,
        radiusMm: bottomTextRadiusMm,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
    ],
    icons: [],
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};
