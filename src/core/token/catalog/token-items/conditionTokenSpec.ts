import type { TokenSpec } from "../../types";
import type { CatalogCondition } from "../catalogTypes";
import type { SharedConfig } from "./tokenItem";
import { buildIconSpec, sharedTokenFields } from "./tokenSpecParts";

const DEFAULT_CONDITION_ICON_SCALE_MULTIPLIER = 1;

// Icon only, no name: each condition's icon is recognizable on its own, so the whole disc goes to
// the icon. Goal Influence's diameter rather than the smaller shared disc, so it reads at a glance.
export const buildConditionTokenSpec = (
  condition: CatalogCondition,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const iconScaleMultiplier =
    condition.iconScale ?? DEFAULT_CONDITION_ICON_SCALE_MULTIPLIER;
  // condition.iconScale's default (0.72) sits below the crest scale on purpose: these icons fill
  // their own square, so a box fit pushes their corners past the rim (poison already touches it
  // at 0.82). 0.72 leaves every condition icon about 1mm clear of the edge on the 20mm disc.
  const iconScale = sharedConfig.condition.iconScale * iconScaleMultiplier;

  return {
    version: 1,
    shape: sharedConfig.goalInfluenceShape,
    textLayout: "flat",
    lines: [],
    icons: [buildIconSpec(condition.iconId, "center", iconScale, sharedConfig)],
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};
