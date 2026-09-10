import { TokenSpec } from "../../types";
import { CatalogGenericToken } from "../catalogTypes";
import { SharedConfig } from "./tokenItem";
import {
  buildIconSpec,
  DEFAULT_ICON_SCALE,
  guildCrestScale,
  sharedTokenFields,
} from "./tokenSpecParts";

export const buildGenericTokenSpec = (
  generic: CatalogGenericToken,
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const iconId = generic.iconId ?? guildIconId;
  const iconScale = DEFAULT_ICON_SCALE * guildCrestScale(iconId, guildIconId, guildIconScale);

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
