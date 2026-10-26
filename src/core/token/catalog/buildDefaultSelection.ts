import type { GuildCatalog } from "./catalogTypes";
import { characterSelectableIds } from "./characterSelectableIds";
import { GENERIC_CATALOG_ID } from "./genericCatalog";
import {
  type CounterSelection,
  MIN_COPIES,
  type TokenSelection,
} from "./token-items/tokenItem";

// A typical Guild Ball game's own real quantities, not just each counter's bare
// minimum, so a first visit to a guild starts from a usable token set instead
// of an empty one.
const DEFAULT_INFLUENCE_COPIES = 13;
const DEFAULT_MOMENTUM_COPIES = 15;
const DEFAULT_GOAL_INFLUENCE_COPIES = 2;
const DEFAULT_CONDITION_COPIES = 4;
const DEFAULT_GAME_PLAN_COPIES = 1;

const enabledCounter = (copies: number): CounterSelection => ({
  enabled: true,
  copies,
});

const crestCounter = (
  copies: number,
  isEnabled: boolean,
): CounterSelection => ({
  enabled: isEnabled,
  copies,
});

// A guild's first-ever selection: everything the catalog offers, checked by
// default, so the user opts out of what they don't want rather than opting into
// everything from scratch. Once a guild has been visited, its selection is
// remembered instead of being rebuilt from here again.
export const buildDefaultSelection = (
  catalog: GuildCatalog,
): TokenSelection => {
  const characterTokenIds = catalog.characters.flatMap(characterSelectableIds);

  const genericTokens: Record<string, CounterSelection> = {};

  for (const generic of catalog.genericTokens) {
    genericTokens[generic.name] = enabledCounter(MIN_COPIES);
  }

  const conditions: Record<string, CounterSelection> = {};

  for (const condition of catalog.conditions) {
    const isApplied = catalog.appliedConditionIds.includes(condition.id);

    conditions[condition.id] = {
      enabled: isApplied,
      copies: DEFAULT_CONDITION_COPIES,
    };
  }

  const gamePlans: Record<string, CounterSelection> = {};

  for (const gamePlan of catalog.gamePlans) {
    gamePlans[gamePlan.id] = enabledCounter(
      gamePlan.maxCopies ?? DEFAULT_GAME_PLAN_COPIES,
    );
  }

  // The generic catalog still offers Influence, Momentum and Goal Influence as
  // a neutral set wearing the Guild Ball logo, but unchecked: a player normally
  // prints their own guild's.
  const areCrestCountersEnabled = catalog.guildId !== GENERIC_CATALOG_ID;

  return {
    characterTokenIds,
    characterTokenCopies: {},
    genericTokens,
    influence: crestCounter(DEFAULT_INFLUENCE_COPIES, areCrestCountersEnabled),
    momentum: crestCounter(DEFAULT_MOMENTUM_COPIES, areCrestCountersEnabled),
    goalInfluence: crestCounter(
      DEFAULT_GOAL_INFLUENCE_COPIES,
      areCrestCountersEnabled,
    ),
    conditions,
    gamePlans,
  };
};
