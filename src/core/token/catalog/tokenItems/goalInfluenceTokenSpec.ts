import { estimateAscentMm } from "../../text/glyphMetrics";
import { TokenSpec } from "../../types";
import { TEXT_COLOR_GROUP_ID } from "../deriveReliefColor";
import { SharedConfig } from "./tokenItem";
import { buildIconSpec, sharedTokenFields } from "./tokenSpecParts";

// Moved outward from its old 0.55 now that Goal Influence no longer wears a ring border (see
// buildGoalInfluenceTokenSpec below): the space that border used to occupy is free for the text
// to use instead.
const GOAL_INFLUENCE_TEXT_RADIUS_RATIO = 0.75;
const GOAL_INFLUENCE_TEXT_SIZE_MM = 2.2;
// Up from 0.35 (originally raised to 0.55, then further by user feedback): that low value was
// sized to squeeze between a ring border and the text, both of which the icon no longer has to
// share room with as tightly (the ring is gone, the text moved out). A crest this small was hard
// to print cleanly. Kept under GOAL_INFLUENCE_TEXT_RADIUS_RATIO (0.75) at guildIconScale 1 so
// there's still a margin before the icon's own edge reaches the text at the default scale.
const GOAL_INFLUENCE_ICON_SCALE = 0.65;
const GOAL_INFLUENCE_TOP_TEXT = "Goal";
const GOAL_INFLUENCE_BOTTOM_TEXT = "Influence";

export const buildGoalInfluenceTokenSpec = (
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const discRadiusMm = sharedConfig.goalInfluenceShape.diameterMm / 2;
  const topTextRadiusMm = discRadiusMm * GOAL_INFLUENCE_TEXT_RADIUS_RATIO;
  // "Goal" (top) reads outward, so its ink grows past topTextRadiusMm; "Influence" (bottom)
  // reads inward (see computeRingReliefComponents.ts's orientation doc comment), so its ink
  // grows back toward its own radius from further out. Pushing the bottom radius out by one
  // ascent makes both lines' ink line up at the same distance from center instead of
  // "Influence" reading closer to the icon than "Goal" reads to the rim.
  const bottomTextRadiusMm = topTextRadiusMm + estimateAscentMm(GOAL_INFLUENCE_TEXT_SIZE_MM);

  return {
    version: 1,
    shape: sharedConfig.goalInfluenceShape,
    textLayout: "ring",
    lines: [
      {
        text: GOAL_INFLUENCE_TOP_TEXT,
        sizeMm: GOAL_INFLUENCE_TEXT_SIZE_MM,
        radiusMm: topTextRadiusMm,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
      {
        text: GOAL_INFLUENCE_BOTTOM_TEXT,
        sizeMm: GOAL_INFLUENCE_TEXT_SIZE_MM,
        radiusMm: bottomTextRadiusMm,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
    ],
    icons: [
      buildIconSpec(
        guildIconId,
        "center",
        GOAL_INFLUENCE_ICON_SCALE * guildIconScale,
        sharedConfig,
      ),
    ],
    // No ring border here (unlike Momentum, see momentumTokenSpec.ts): that border was designed
    // around the old, circular Guild Ball logo this token used to wear at its center. A guild's
    // own crest isn't circular, so the ring next to it read as a redundant "double circle"
    // instead of one clean badge.
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};
