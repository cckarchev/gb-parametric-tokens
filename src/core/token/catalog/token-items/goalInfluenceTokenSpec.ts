import { TokenSpec } from "../../types";
import { buildRingTokenSpec } from "./ringTokenSpec";
import { SharedConfig } from "./tokenItem";

const GOAL_INFLUENCE_TOP_TEXT = "Goal";
const GOAL_INFLUENCE_BOTTOM_TEXT = "Influence";

export const buildGoalInfluenceTokenSpec = (
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  return buildRingTokenSpec(
    GOAL_INFLUENCE_TOP_TEXT,
    GOAL_INFLUENCE_BOTTOM_TEXT,
    guildIconId,
    guildIconScale,
    sharedConfig,
  );
};
