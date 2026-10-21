import type { TokenSpec } from "../../types";
import type { SharedConfig } from "./tokenItem";
import {
  buildIconSpec,
  guildCrestScale,
  sharedTokenFields,
} from "./tokenSpecParts";

// A plain disc wearing one centered icon and no text: Influence and a guild's generic tokens are
// both this, and differ only in which icon they wear.
export const buildCrestDiscTokenSpec = (
  iconId: string,
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const iconScale =
    sharedConfig.discToken.crestScale *
    guildCrestScale(iconId, guildIconId, guildIconScale);

  return {
    version: 1,
    shape: sharedConfig.discShape,
    textLayout: "flat",
    lines: [],
    icons: [buildIconSpec(iconId, "center", iconScale, sharedConfig)],
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};
