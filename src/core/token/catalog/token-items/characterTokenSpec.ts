import { TEXT_COLOR_GROUP_ID } from "../../mesh/colorGroups";
import { TokenSpec } from "../../types";
import { CatalogEffect } from "../catalogTypes";
import { buildRingTokenSpec } from "./ringTokenSpec";
import { SharedConfig } from "./tokenItem";
import { buildIconSpec, sharedTokenFields } from "./tokenSpecParts";

export const buildCharacterTokenSpec = (
  effect: CatalogEffect,
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  if (effect.layout === "ring") {
    return buildRingTokenSpec(
      effect.name,
      effect.effect,
      guildIconId,
      guildIconScale,
      sharedConfig,
    );
  }

  const { crestScale, balanceNameScale, balanceEffectScale, singleLineNameSizeMm } =
    sharedConfig.characterToken;
  const iconScale = crestScale * guildIconScale;
  const secondLineText = sharedConfig.showSecondLine ? effect.effect : undefined;
  const isSingleLine = secondLineText === undefined;

  // A lone name gets the whole band, so it prints larger. With two lines, balanceTwoLineSizes
  // shrinks the name a touch and grows the effect text, so the token reads more evenly instead of
  // the effect text looking like an afterthought.
  const twoLineNameSizeMm = sharedConfig.balanceTwoLineSizes
    ? sharedConfig.nameSizeMm * balanceNameScale
    : sharedConfig.nameSizeMm;
  const nameSizeMm = isSingleLine ? singleLineNameSizeMm : twoLineNameSizeMm;

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
              ? sharedConfig.effectSizeMm * balanceEffectScale
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
