import { TokenSpec } from "../../types";
import { SharedConfig } from "./tokenItem";
import {
  buildIconSpec,
  DEFAULT_ICON_SCALE,
  guildCrestScale,
  sharedTokenFields,
} from "./tokenSpecParts";

// A single, identical, unnumbered token: Influence and Momentum are physical chips you stack to
// count, so the selection's copies count is the quantity to print rather than a range of distinct
// numbered values, which is what an earlier design generated.
// influenceIconId is always the current guild's own crest (see useTokenGenerator.ts, which
// seeds it from catalog.name on every guild load), so it earns the same guildIconScale
// treatment as a character or generic token's crest.
export const buildInfluenceTokenSpec = (
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const iconScale =
    DEFAULT_ICON_SCALE * guildCrestScale(sharedConfig.influenceIconId, guildIconId, guildIconScale);

  return {
    version: 1,
    shape: sharedConfig.discShape,
    textLayout: "flat",
    lines: [],
    icons: [buildIconSpec(sharedConfig.influenceIconId, "center", iconScale, sharedConfig)],
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};
