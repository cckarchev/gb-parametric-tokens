import { estimateAscentMm } from "../../text/glyphMetrics";
import { LineSpec, TokenSpec } from "../../types";
import { TEXT_COLOR_GROUP_ID } from "../deriveReliefColor";
import { SharedConfig } from "./tokenItem";
import { buildIconSpec, sharedTokenFields } from "./tokenSpecParts";

// Moved outward from its old 0.55 now that Goal Influence no longer wears a ring border (see
// buildRingTokenSpec below): the space that border used to occupy is free for the text to use
// instead.
const RING_TEXT_RADIUS_RATIO = 0.75;
const RING_TEXT_SIZE_MM = 2.2;
// Up from 0.35 (originally raised to 0.55, then further by user feedback): that low value was
// sized to squeeze between a ring border and the text, both of which the icon no longer has to
// share room with as tightly (the ring is gone, the text moved out). A crest this small was hard
// to print cleanly. Kept under RING_TEXT_RADIUS_RATIO (0.75) at guildIconScale 1 so there's
// still a margin before the icon's own edge reaches the text at the default scale.
const RING_ICON_SCALE = 0.65;

// The round, crest-centered badge Goal Influence introduced, shared by any token that wants the
// same look with its own two lines of curved text (see CatalogEffect's "ring" layout).
export const buildRingTokenSpec = (
  topText: string,
  bottomText: string | undefined,
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const discRadiusMm = sharedConfig.goalInfluenceShape.diameterMm / 2;
  const topTextRadiusMm = discRadiusMm * RING_TEXT_RADIUS_RATIO;
  // The top line reads outward, so its ink grows past topTextRadiusMm; the bottom line reads
  // inward (see computeRingReliefComponents.ts's orientation doc comment), so its ink grows
  // back toward its own radius from further out. Pushing the bottom radius out by one ascent
  // makes both lines' ink line up at the same distance from center instead of the bottom line
  // reading closer to the icon than the top one reads to the rim.
  const bottomTextRadiusMm = topTextRadiusMm + estimateAscentMm(RING_TEXT_SIZE_MM);

  const topLine: LineSpec = {
    text: topText,
    sizeMm: RING_TEXT_SIZE_MM,
    radiusMm: topTextRadiusMm,
    colorGroup: TEXT_COLOR_GROUP_ID,
  };

  const lines =
    bottomText !== undefined
      ? [
          topLine,
          {
            text: bottomText,
            sizeMm: RING_TEXT_SIZE_MM,
            radiusMm: bottomTextRadiusMm,
            colorGroup: TEXT_COLOR_GROUP_ID,
          },
        ]
      : [topLine];

  return {
    version: 1,
    shape: sharedConfig.goalInfluenceShape,
    textLayout: "ring",
    lines,
    icons: [buildIconSpec(guildIconId, "center", RING_ICON_SCALE * guildIconScale, sharedConfig)],
    // No ring border here (unlike Momentum, see momentumTokenSpec.ts): that border was designed
    // around the old, circular Guild Ball logo Goal Influence used to wear at its center. A
    // guild's own crest isn't circular, so the ring next to it read as a redundant "double
    // circle" instead of one clean badge.
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};
