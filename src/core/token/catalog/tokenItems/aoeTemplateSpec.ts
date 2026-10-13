import { CENTER_ANGLE_DEG } from "../../geometry/angleConventions";
import { estimateAscentMm } from "../../text/glyphMetrics";
import { CrowfootSpec, DiscShapeSpec, LineSpec, TokenSpec } from "../../types";
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

// The crow's foot: three short arcs of the 3″ band, each at the end of a spoke from the center,
// the first spoke pointing up. Spokes 5mm wide so the template stays firm (user's call; a
// candidate to become a setting later), inside corners filleted for durability, arc ends
// rounded. Each 30° arc carries about 18mm of text, which is why the text is smaller than the
// full ring's: at 3mm every name fits.
const CROWFOOT: CrowfootSpec = {
  spokeCount: 3,
  spokeWidthMm: 5,
  arcSweepDeg: 30,
  cornerRadiusMm: 1.5,
  filletRadiusMm: 3,
};
const CROWFOOT_TEXT_SIZE_MM = 3;
const LOWER_LEFT_ARC_ANGLE_DEG = 210;
const LOWER_RIGHT_ARC_ANGLE_DEG = 330;
const CROWFOOT_ARC_ANGLES_DEG = [
  CENTER_ANGLE_DEG,
  LOWER_LEFT_ARC_ANGLE_DEG,
  LOWER_RIGHT_ARC_ANGLE_DEG,
];
// The stretch of each spoke the effect text may use: clear of the center, where the three spokes
// overlap and their texts would collide, and short of the arc at the spoke's far end.
const SPOKE_TEXT_CENTER_CLEARANCE_MM = 4;
const SPOKE_TEXT_BAND_MARGIN_MM = 1;
const SPOKE_TEXT_START_MM = SPOKE_TEXT_CENTER_CLEARANCE_MM;
const SPOKE_TEXT_END_MM = AOE_INNER_DIAMETER_MM / 2 - SPOKE_TEXT_BAND_MARGIN_MM;
const SPOKE_TEXT_RADIUS_MM = (SPOKE_TEXT_START_MM + SPOKE_TEXT_END_MM) / 2;

// A 3″ AOE is a game object of fixed size, so nothing here reads SharedConfig's shapes: only
// relief, thickness, print profile, and colors come from the shared config. The full ring wears
// no guild crest: one fitted to the band came out around 5mm, too small to print its detail
// (user's call to drop it rather than widen the band or bulge it). The compact disc has room for
// one at its center, and the crow's foot none (its arcs are as narrow as the ring's band).
const AOE_SHAPE: DiscShapeSpec = {
  type: "disc",
  diameterMm: AOE_OUTER_DIAMETER_MM,
  innerDiameterMm: AOE_INNER_DIAMETER_MM,
};

const CROWFOOT_SHAPE: DiscShapeSpec = {
  ...AOE_SHAPE,
  crowfoot: CROWFOOT,
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
const computeBandTextRadii = (sizeMm: number): { topMm: number; bottomMm: number } => {
  const bandMidRadiusMm = (AOE_OUTER_DIAMETER_MM + AOE_INNER_DIAMETER_MM) / 4;
  const halfAscentMm = estimateAscentMm(sizeMm) / 2;

  return { topMm: bandMidRadiusMm - halfAscentMm, bottomMm: bandMidRadiusMm + halfAscentMm };
};

const buildRingLines = (template: CatalogAoeTemplate): LineSpec[] => {
  const radii = computeBandTextRadii(AOE_TEXT_SIZE_MM);

  return buildLines(template, AOE_TEXT_SIZE_MM, radii.topMm, radii.bottomMm);
};

// The name on every arc (a top one reading outward, lower ones inward, so all read upright) and
// the effect straight along every spoke, centered on the spoke's free stretch. Every arc and
// spoke repeats the same text, so whichever side a player stands on has one to read.
const buildCrowfootLines = (template: CatalogAoeTemplate): LineSpec[] => {
  const radii = computeBandTextRadii(CROWFOOT_TEXT_SIZE_MM);

  const nameLines = CROWFOOT_ARC_ANGLES_DEG.map((centerAngleDeg): LineSpec => {
    const radiusMm = centerAngleDeg === CENTER_ANGLE_DEG ? radii.topMm : radii.bottomMm;

    return {
      text: template.name,
      sizeMm: CROWFOOT_TEXT_SIZE_MM,
      radiusMm,
      centerAngleDeg,
      colorGroup: TEXT_COLOR_GROUP_ID,
    };
  });

  const effectLines = CROWFOOT_ARC_ANGLES_DEG.map((centerAngleDeg): LineSpec => {
    return {
      text: template.effect,
      sizeMm: CROWFOOT_TEXT_SIZE_MM,
      radiusMm: SPOKE_TEXT_RADIUS_MM,
      centerAngleDeg,
      placement: "radial",
      colorGroup: TEXT_COLOR_GROUP_ID,
    };
  });

  return [...nameLines, ...effectLines];
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
  const sharedFields = {
    version: 1 as const,
    textLayout: "ring" as const,
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };

  if (sharedConfig.aoeTemplateVariant === "compactDisc") {
    const compactIconScale = COMPACT_ICON_SCALE * guildIconScale;

    return {
      ...sharedFields,
      shape: COMPACT_SHAPE,
      lines: buildCompactLines(template),
      icons: [buildIconSpec(guildIconId, "center", compactIconScale, sharedConfig)],
    };
  }

  if (sharedConfig.aoeTemplateVariant === "crowfoot") {
    return {
      ...sharedFields,
      shape: CROWFOOT_SHAPE,
      lines: buildCrowfootLines(template),
      icons: [],
    };
  }

  return {
    ...sharedFields,
    shape: AOE_SHAPE,
    lines: buildRingLines(template),
    icons: [],
  };
};
