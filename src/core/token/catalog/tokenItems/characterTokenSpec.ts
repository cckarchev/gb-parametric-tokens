import { TokenSpec } from "../../types";
import { CatalogEffect } from "../catalogTypes";
import { TEXT_COLOR_GROUP_ID } from "../deriveReliefColor";
import { SharedConfig } from "./tokenItem";
import { buildIconSpec, DEFAULT_ICON_SCALE, sharedTokenFields } from "./tokenSpecParts";

// Starting point for balanceTwoLineSizes, tunable by feel against a real render like every other
// geometry/typography default in this app: shrinks the name a touch and grows the effect text so
// a two-line character token reads more evenly instead of the effect text looking like an
// afterthought.
const TWO_LINE_NAME_BALANCE_SCALE = 0.9;
const TWO_LINE_EFFECT_BALANCE_SCALE = 1.2;

export const buildCharacterTokenSpec = (
  effect: CatalogEffect,
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const iconScale = DEFAULT_ICON_SCALE * guildIconScale;
  const secondLineText = sharedConfig.showSecondLine ? effect.effect : undefined;

  const nameSizeMm =
    secondLineText !== undefined && sharedConfig.balanceTwoLineSizes
      ? sharedConfig.nameSizeMm * TWO_LINE_NAME_BALANCE_SCALE
      : sharedConfig.nameSizeMm;

  const nameLine = {
    text: effect.name,
    sizeMm: nameSizeMm,
    colorGroup: TEXT_COLOR_GROUP_ID,
  };

  const lines =
    secondLineText !== undefined
      ? [
          nameLine,
          {
            text: secondLineText,
            sizeMm: sharedConfig.balanceTwoLineSizes
              ? sharedConfig.effectSizeMm * TWO_LINE_EFFECT_BALANCE_SCALE
              : sharedConfig.effectSizeMm,
            colorGroup: TEXT_COLOR_GROUP_ID,
          },
        ]
      : [nameLine];

  return {
    version: 1,
    shape: sharedConfig.arcShape,
    textLayout: "arc",
    lines,
    icons: [
      buildIconSpec(guildIconId, "left", iconScale, sharedConfig),
      buildIconSpec(guildIconId, "right", iconScale, sharedConfig),
    ],
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};
