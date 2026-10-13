import { LineSpec, TokenSpec } from "../../types";
import { TEXT_COLOR_GROUP_ID } from "../deriveReliefColor";
import { computeRingTextRadii } from "./ringTextRadii";
import { SharedConfig } from "./tokenItem";
import { buildIconSpec, sharedTokenFields } from "./tokenSpecParts";

// The round, crest-centered badge Goal Influence introduced, shared by any token that wants the
// same look with its own two lines of curved text (see CatalogEffect's "ring" layout).
export const buildRingTokenSpec = (
  topText: string,
  bottomText: string | undefined,
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const { textSizeMm, textInsetMm, crestScale } = sharedConfig.ringBadge;
  // The text sits textInsetMm in from the rim (ringBadge's default 1mm is where the text landed
  // once Goal Influence lost its ring border and the text moved outward into that space).
  const radii = computeRingTextRadii(
    sharedConfig.goalInfluenceShape.diameterMm,
    textInsetMm,
    textSizeMm,
  );

  const topLine: LineSpec = {
    text: topText,
    sizeMm: textSizeMm,
    radiusMm: radii.topMm,
    colorGroup: TEXT_COLOR_GROUP_ID,
  };

  const lines =
    bottomText !== undefined
      ? [
          topLine,
          {
            text: bottomText,
            sizeMm: textSizeMm,
            radiusMm: radii.bottomMm,
            colorGroup: TEXT_COLOR_GROUP_ID,
          },
        ]
      : [topLine];

  return {
    version: 1,
    shape: sharedConfig.goalInfluenceShape,
    textLayout: "ring",
    lines,
    // ringBadge's default crest scale (0.65) went up from 0.35 by user feedback: a crest that
    // small was hard to print cleanly. At guildIconScale 1 it still clears the text.
    icons: [buildIconSpec(guildIconId, "center", crestScale * guildIconScale, sharedConfig)],
    // No ring border here (unlike Momentum, see momentumTokenSpec.ts): that border was designed
    // around the old, circular Guild Ball logo Goal Influence used to wear at its center. A
    // guild's own crest isn't circular, so the ring next to it read as a redundant "double
    // circle" instead of one clean badge.
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};
