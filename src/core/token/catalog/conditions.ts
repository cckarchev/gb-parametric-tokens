import conditionsData from "../../../data/conditions.json";
import { CatalogCondition } from "./catalogTypes";

const conditions: CatalogCondition[] = conditionsData;

export const conditionsForGuild = (guildId: string): CatalogCondition[] => {
  return conditions.filter((condition) => {
    if (condition.guilds === undefined) {
      return true;
    }

    return condition.guilds.includes(guildId);
  });
};
