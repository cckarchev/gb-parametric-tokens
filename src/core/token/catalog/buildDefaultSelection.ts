import { GuildCatalog } from "./catalogTypes";
import { characterSelectableIds } from "./characterSelectableIds";
import { CounterSelection, TokenSelection } from "./tokenItems/tokenItem";

const MIN_GENERIC_COPIES = 1;

// A typical Guild Ball game's own real quantities, not just each counter's bare minimum, so a
// first visit to a guild starts from a usable token set instead of an empty one.
const DEFAULT_INFLUENCE_COPIES = 13;
const DEFAULT_MOMENTUM_COPIES = 15;
const DEFAULT_GOAL_INFLUENCE_COPIES = 2;
const DEFAULT_CONDITION_COPIES = 4;

const enabledCounter = (copies: number): CounterSelection => ({ enabled: true, copies });

// A guild's first-ever selection: everything the catalog offers, tildado by default, so the
// user opts out of what they don't want rather than opting into everything from scratch. Once a
// guild has been visited, its selection is remembered instead of being rebuilt from here again.
export const buildDefaultSelection = (catalog: GuildCatalog): TokenSelection => {
  const characterTokenIds = catalog.characters.flatMap(characterSelectableIds);

  const genericTokens: Record<string, CounterSelection> = {};

  for (const generic of catalog.genericTokens) {
    genericTokens[generic.name] = enabledCounter(MIN_GENERIC_COPIES);
  }

  const conditions: Record<string, CounterSelection> = {};

  for (const condition of catalog.conditions) {
    const isApplied = catalog.appliedConditionIds.includes(condition.id);

    conditions[condition.id] = { enabled: isApplied, copies: DEFAULT_CONDITION_COPIES };
  }

  return {
    characterTokenIds,
    characterTokenCopies: {},
    genericTokens,
    influence: enabledCounter(DEFAULT_INFLUENCE_COPIES),
    momentum: enabledCounter(DEFAULT_MOMENTUM_COPIES),
    goalInfluence: enabledCounter(DEFAULT_GOAL_INFLUENCE_COPIES),
    conditions,
  };
};
