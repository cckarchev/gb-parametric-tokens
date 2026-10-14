import { MM_PER_INCH } from "../../../units";
import { CENTER_ANGLE_DEG } from "../../geometry/angleConventions";
import { TEXT_COLOR_GROUP_ID } from "../../mesh/colorGroups";
import { estimateAscentMm } from "../../text/glyphMetrics";
import { resolveRingLineOrientation } from "../../text/ringLineOrientation";
import { CrowfootSpec, DiscShapeSpec, LineSpec, TokenSpec } from "../../types";
import { CatalogAoeTemplate } from "../catalogTypes";
import { computeRingTextRadii } from "./ringTextRadii";
import { AoeTuning, CrowfootTuning, SharedConfig } from "./tokenItem";
import { buildIconSpec, sharedTokenFields } from "./tokenSpecParts";

const AOE_DIAMETER_INCHES = 3;
const AOE_OUTER_DIAMETER_MM = AOE_DIAMETER_INCHES * MM_PER_INCH;
const AOE_OUTER_RADIUS_MM = AOE_OUTER_DIAMETER_MM / 2;
const FULL_TURN_DEG = 360;
// Fewer than two spokes is no longer a crow's foot, just a stick.
export const MIN_SPOKE_COUNT = 2;

// The compact marker: 1″ across, so the 1.5″ AOE radius ends exactly 1″ past its edge. A whole
// inch is what makes it worth using: half inches are hard to measure on the table.
const COMPACT_DIAMETER_INCHES = 1;
const COMPACT_DIAMETER_MM = COMPACT_DIAMETER_INCHES * MM_PER_INCH;

// A 3″ AOE is a game object of fixed size: its outer diameter and the compact disc's are rules,
// not settings. Everything else (band width, text sizes, the crow's foot's geometry) comes from
// SharedConfig's aoe group. The default band (6mm) is wide enough to carry readable curved text,
// narrow enough that models stand on the table inside the ring instead of tilting on top of it.
// The full ring wears no guild crest: one fitted to the band came out around 5mm, too small to
// print its detail (user's call to drop it rather than widen the band or bulge it). The compact
// disc has room for one at its center, and the crow's foot none (its arcs are as narrow as the
// ring's band).
const buildAoeShape = (bandWidthMm: number): DiscShapeSpec => {
  const innerDiameterMm = AOE_OUTER_DIAMETER_MM - bandWidthMm * 2;

  return { type: "disc", diameterMm: AOE_OUTER_DIAMETER_MM, innerDiameterMm };
};

// A whole number, so the outline (discFootprint.ts loops while index < spokeCount) and the texts
// (one per spoke) always count the same spokes, even for a value typed as 2.6.
const resolveSpokeCount = (spokeCount: number): number => {
  return Math.max(MIN_SPOKE_COUNT, Math.round(spokeCount));
};

// The crow's foot: short arcs of the 3″ band, each at the end of a spoke from the center, the
// first spoke pointing up. Defaults: spokes 5mm wide so the template stays firm (user's call),
// inside corners filleted for durability, arc ends rounded. The text defaults to 4mm on 40° arcs:
// at 3mm a 0.4mm nozzle (fdm-04) lost strokes on every template, and at 4mm the longest names
// (Ghostly Visage, Nature's Growth...) need 40° of arc to fit.
const toCrowfootSpec = (tuning: CrowfootTuning): CrowfootSpec => {
  const filletRadiusMm = tuning.filletEnabled ? tuning.filletRadiusMm : 0;

  return {
    spokeCount: resolveSpokeCount(tuning.spokeCount),
    spokeWidthMm: tuning.spokeWidthMm,
    arcSweepDeg: tuning.arcSweepDeg,
    cornerRadiusMm: tuning.cornerRadiusMm,
    filletRadiusMm,
  };
};

// Same angles discFootprint.ts gives the spokes: the first up, the rest evenly around.
const computeSpokeAnglesDeg = (spokeCount: number): number[] => {
  const stepDeg = FULL_TURN_DEG / spokeCount;

  return Array.from({ length: spokeCount }, (_, index) => CENTER_ANGLE_DEG + stepDeg * index);
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
const computeBandTextRadii = (
  bandWidthMm: number,
  sizeMm: number,
): { topMm: number; bottomMm: number } => {
  const bandMidRadiusMm = AOE_OUTER_RADIUS_MM - bandWidthMm / 2;
  const halfAscentMm = estimateAscentMm(sizeMm) / 2;

  return { topMm: bandMidRadiusMm - halfAscentMm, bottomMm: bandMidRadiusMm + halfAscentMm };
};

const buildRingLines = (template: CatalogAoeTemplate, aoe: AoeTuning): LineSpec[] => {
  const sizeMm = aoe.ring.textSizeMm;
  const radii = computeBandTextRadii(aoe.bandWidthMm, sizeMm);

  return buildLines(template, sizeMm, radii.topMm, radii.bottomMm);
};

// The stretch of each spoke the effect text may use: clear of the center, where the spokes
// overlap and their texts would collide, and short of the arc at the spoke's far end. The text is
// centered on that stretch.
const computeSpokeTextRadiusMm = (aoe: AoeTuning): number => {
  const startMm = aoe.crowfoot.spokeTextCenterClearanceMm;
  const bandInnerRadiusMm = AOE_OUTER_RADIUS_MM - aoe.bandWidthMm;
  const endMm = bandInnerRadiusMm - aoe.crowfoot.spokeTextBandMarginMm;

  return (startMm + endMm) / 2;
};

// The name on every arc (upper ones reading outward, lower ones inward, so all read upright) and
// the effect straight along every spoke, centered on the spoke's free stretch. Every arc and
// spoke repeats the same text, so whichever side a player stands on has one to read.
const buildCrowfootLines = (template: CatalogAoeTemplate, aoe: AoeTuning): LineSpec[] => {
  const sizeMm = aoe.crowfoot.textSizeMm;
  const radii = computeBandTextRadii(aoe.bandWidthMm, sizeMm);
  const spokeAnglesDeg = computeSpokeAnglesDeg(resolveSpokeCount(aoe.crowfoot.spokeCount));
  const spokeTextRadiusMm = computeSpokeTextRadiusMm(aoe);

  const nameLines = spokeAnglesDeg.map((centerAngleDeg): LineSpec => {
    const readsInward = resolveRingLineOrientation(centerAngleDeg) === "inward";
    const radiusMm = readsInward ? radii.bottomMm : radii.topMm;

    return {
      text: template.name,
      sizeMm,
      radiusMm,
      centerAngleDeg,
      colorGroup: TEXT_COLOR_GROUP_ID,
    };
  });

  const effectLines = spokeAnglesDeg.map((centerAngleDeg): LineSpec => {
    return {
      text: template.effect,
      sizeMm,
      radiusMm: spokeTextRadiusMm,
      centerAngleDeg,
      placement: "radial",
      colorGroup: TEXT_COLOR_GROUP_ID,
    };
  });

  return [...nameLines, ...effectLines];
};

// Ring text around the guild crest, laid out like Goal Influence (see ringTokenSpec.ts).
const buildCompactLines = (
  template: CatalogAoeTemplate,
  tuning: AoeTuning["compactDisc"],
): LineSpec[] => {
  const radii = computeRingTextRadii(COMPACT_DIAMETER_MM, tuning.textInsetMm, tuning.textSizeMm);

  return buildLines(template, tuning.textSizeMm, radii.topMm, radii.bottomMm);
};

export const buildAoeTemplateSpec = (
  template: CatalogAoeTemplate,
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const aoe = sharedConfig.aoe;
  const sharedFields = {
    version: 1 as const,
    textLayout: "ring" as const,
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };

  if (sharedConfig.aoeTemplateVariant === "compactDisc") {
    const compactTuning = aoe.compactDisc;
    // The compact crest's default (0.55) is down from Goal Influence's 0.65, by the user's call
    // after seeing it on the disc: at that size the crest read a bit too big.
    const compactIconScale = compactTuning.crestScale * guildIconScale;

    return {
      ...sharedFields,
      shape: COMPACT_SHAPE,
      lines: buildCompactLines(template, compactTuning),
      icons: [buildIconSpec(guildIconId, "center", compactIconScale, sharedConfig)],
    };
  }

  if (sharedConfig.aoeTemplateVariant === "crowfoot") {
    return {
      ...sharedFields,
      shape: { ...buildAoeShape(aoe.bandWidthMm), crowfoot: toCrowfootSpec(aoe.crowfoot) },
      lines: buildCrowfootLines(template, aoe),
      icons: [],
    };
  }

  return {
    ...sharedFields,
    shape: buildAoeShape(aoe.bandWidthMm),
    lines: buildRingLines(template, aoe),
    icons: [],
  };
};
