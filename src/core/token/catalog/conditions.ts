import conditionsData from "@/data/conditions.json";

import type { CatalogCondition } from "./catalogTypes";

const conditions: CatalogCondition[] = conditionsData;

// The generic catalog belongs to no guild, so it offers every condition, Disease included.
export const allConditions = (): CatalogCondition[] => conditions;

export const conditionsForGuild = (guildId: string): CatalogCondition[] =>
  conditions.filter((condition) => {
    if (condition.guilds === undefined) {
      return true;
    }

    return condition.guilds.includes(guildId);
  });
