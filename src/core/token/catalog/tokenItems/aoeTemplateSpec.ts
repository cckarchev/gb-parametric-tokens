import { estimateAscentMm } from "../../text/glyphMetrics";
import { DiscShapeSpec, LineSpec, TokenSpec } from "../../types";
import { CatalogAoeTemplate } from "../catalogTypes";
import { TEXT_COLOR_GROUP_ID } from "../deriveReliefColor";
import { SharedConfig } from "./tokenItem";
import { buildIconSpec, sharedTokenFields } from "./tokenSpecParts";

const MM_PER_INCH = 25.4;
const AOE_DIAMETER_INCHES = 3;
const AOE_OUTER_DIAMETER_MM = AOE_DIAMETER_INCHES * MM_PER_INCH;
// Wide enough to carry readable curved text, narrow enough that models stand on the
// table inside the ring instead of tilting on top of it.
const AOE_BAND_WIDTH_MM = 6;
const AOE_INNER_DIAMETER_MM = AOE_OUTER_DIAMETER_MM - AOE_BAND_WIDTH_MM * 2;
// Starting point, tuned against a real render like every other typography default here.
const AOE_TEXT_SIZE_MM = 3.5;

// The compact marker: 1″ across, so the 1.5″ AOE radius ends exactly 1″ past its edge. A whole
// inch is what makes it worth using: half inches are hard to measure on the table.
const COMPACT_DIAMETER_INCHES = 1;
const COMPACT_DIAMETER_MM = COMPACT_DIAMETER_INCHES * MM_PER_INCH;
// Same proportions as Goal Influence (see ringTokenSpec.ts): ring text around the guild crest.
const COMPACT_TEXT_RADIUS_RATIO = 0.75;
// Starting point, tuned against a real render like every other typography default here.
const COMPACT_TEXT_SIZE_MM = 2.6;
// Down from Goal Influence's 0.65, by the user's call after seeing it on the disc: at that size
// the crest read a bit too big.
const COMPACT_ICON_SCALE = 0.55;

// A 3″ AOE is a game object of fixed size, so nothing here reads SharedConfig's shapes: only
// relief, thickness, print profile, and colors come from the shared config. The full ring wears
// no guild crest: one fitted to the band came out around 5mm, too small to print its detail
// (user's call to drop it rather than widen the band or bulge it). The compact disc has room for
// one at its center.
const AOE_SHAPE: DiscShapeSpec = {
  type: "disc",
  diameterMm: AOE_OUTER_DIAMETER_MM,
  innerDiameterMm: AOE_INNER_DIAMETER_MM,
};

const COMPACT_SHAPE: DiscShapeSpec = {
  type: "disc",
  diameterMm: COMPACT_DIAMETER_MM,
};

const buildLines = (
  template: CatalogAoeTemplate,
  sizeMm: number,
  topTextRadiusMm: number,
  bottomTextRadiusMm: number,
): LineSpec[] => {
  return [
    { text: template.name, sizeMm, radiusMm: topTextRadiusMm, colorGroup: TEXT_COLOR_GROUP_ID },
    {
      text: template.effect,
      sizeMm,
      radiusMm: bottomTextRadiusMm,
      colorGroup: TEXT_COLOR_GROUP_ID,
    },
  ];
};

// The top line reads outward, so its ink grows past its radius; the bottom line reads inward,
// so its ink grows back toward center (see ringTokenSpec.ts). Offsetting each by half an ascent
// centers both lines' ink on the band.
const buildRingLines = (template: CatalogAoeTemplate): LineSpec[] => {
  const bandMidRadiusMm = (AOE_OUTER_DIAMETER_MM + AOE_INNER_DIAMETER_MM) / 4;
  const halfAscentMm = estimateAscentMm(AOE_TEXT_SIZE_MM) / 2;
  const topTextRadiusMm = bandMidRadiusMm - halfAscentMm;
  const bottomTextRadiusMm = bandMidRadiusMm + halfAscentMm;

  return buildLines(template, AOE_TEXT_SIZE_MM, topTextRadiusMm, bottomTextRadiusMm);
};

// Pushing the bottom radius out by one ascent lines both lines' ink up at the same distance from
// the rim, as on Goal Influence.
const buildCompactLines = (template: CatalogAoeTemplate): LineSpec[] => {
  const discRadiusMm = COMPACT_DIAMETER_MM / 2;
  const topTextRadiusMm = discRadiusMm * COMPACT_TEXT_RADIUS_RATIO;
  const bottomTextRadiusMm = topTextRadiusMm + estimateAscentMm(COMPACT_TEXT_SIZE_MM);

  return buildLines(template, COMPACT_TEXT_SIZE_MM, topTextRadiusMm, bottomTextRadiusMm);
};

export const buildAoeTemplateSpec = (
  template: CatalogAoeTemplate,
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const isCompact = sharedConfig.aoeTemplateVariant === "compactDisc";
  const shape = isCompact ? COMPACT_SHAPE : AOE_SHAPE;
  const lines = isCompact ? buildCompactLines(template) : buildRingLines(template);
  const compactIconScale = COMPACT_ICON_SCALE * guildIconScale;
  const icons = isCompact
    ? [buildIconSpec(guildIconId, "center", compactIconScale, sharedConfig)]
    : [];

  return {
    version: 1,
    shape,
    textLayout: "ring",
    lines,
    icons,
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};
