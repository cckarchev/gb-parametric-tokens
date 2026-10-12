import { TokenSpec } from "../../types";
import { CatalogCondition } from "../catalogTypes";
import { buildRingTokenSpec } from "./ringTokenSpec";
import { SharedConfig } from "./tokenItem";

// The guild's iconScale only tunes its own crest (see guildCrestScale), so a condition's icon
// stays at the ring's own scale.
const CONDITION_ICON_SCALE = 1;

// The Goal Influence badge with the condition's icon in place of the crest and its name curved
// on top: in a single ink color, Poison, Disease and Bleed are too easy to mix up by icon alone.
export const buildConditionTokenSpec = (
  condition: CatalogCondition,
  sharedConfig: SharedConfig,
): TokenSpec => {
  return buildRingTokenSpec(
    condition.name,
    undefined,
    condition.iconId,
    CONDITION_ICON_SCALE,
    sharedConfig,
  );
};
