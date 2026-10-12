import conditionsData from "../../../data/conditions.json";
import { CatalogCondition } from "./catalogTypes";

const conditions: CatalogCondition[] = conditionsData;

// The generic catalog belongs to no guild, so it offers every condition, Disease included.
export const allConditions = (): CatalogCondition[] => {
  return conditions;
};

export const conditionsForGuild = (guildId: string): CatalogCondition[] => {
  return conditions.filter((condition) => {
    if (condition.guilds === undefined) {
      return true;
    }

    return condition.guilds.includes(guildId);
  });
};
