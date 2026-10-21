import type {
  CatalogGenericToken,
  GuildCatalog,
} from "@/core/token/catalog/catalogTypes";
import { resolveCharacter } from "@/core/token/catalog/characters";
import {
  allConditions,
  conditionsForGuild,
} from "@/core/token/catalog/conditions";
import { gamePlans } from "@/core/token/catalog/gamePlans";
import { GENERIC_CATALOG_ID } from "@/core/token/catalog/genericCatalog";
import { sortRosterNames } from "@/core/token/catalog/sortRosterNames";
import genericData from "@/data/generic.json";

// A guild file as stored: its characters by name only, resolved below from characters.ts, and
// split by role so the picker can list them the way a roster reads.
type RawGuildCatalog = {
  name: string;
  color: string;
  iconScale?: number;
  captains: string[];
  mascots: string[];
  // Squaddies whose own guild is this one, including those that also play for another guild.
  squaddies: string[];
  // Squaddies from another guild that also play for this one.
  guests: string[];
  genericTokens: CatalogGenericToken[];
  conditions: string[];
};

// Eager, so the guild picker can list every guild without a request per guild. Vite bundles the
// files, and the same data serves the picker and the opened guild.
const modules = import.meta.glob("../data/guilds/*.json", {
  eager: true,
}) as Record<string, { default: RawGuildCatalog }>;

// The guild id is the file name ("brewers.json" is "brewers"), so it isn't stored twice.
const guildIdFromPath = (path: string): string => {
  const fileName = path.split("/").pop() ?? path;

  return fileName.replace(/\.json$/, "");
};

// Each role group in a fixed order, alphabetical inside it, so the file's own order doesn't
// matter.
const orderedRosterNames = (raw: RawGuildCatalog): string[] => {
  const roleGroups = [raw.captains, raw.mascots, raw.squaddies, raw.guests];

  return roleGroups.flatMap(sortRosterNames);
};

export const guildCatalogs: GuildCatalog[] = Object.entries(modules).map(
  ([path, module]) => {
    const raw = module.default;
    const guildId = guildIdFromPath(path);

    return {
      guildId,
      name: raw.name,
      color: raw.color,
      iconScale: raw.iconScale,
      characters: orderedRosterNames(raw).map(resolveCharacter),
      genericTokens: raw.genericTokens,
      conditions: conditionsForGuild(guildId),
      appliedConditionIds: raw.conditions,
      gamePlans: [],
    };
  },
);

// Not a guild: the tokens no guild owns (the Game Plan deck, every condition preselected), with
// the Guild Ball logo as its crest (icons/guilds/Generic/logo.svg, named after `name` like any
// guild's). No roster, so it never joins guildCatalogs, whose consumers expect real guilds.
const genericConditions = allConditions();

const genericCatalog: GuildCatalog = {
  guildId: GENERIC_CATALOG_ID,
  name: genericData.name,
  color: genericData.color,
  characters: [],
  genericTokens: [],
  conditions: genericConditions,
  appliedConditionIds: genericConditions.map((condition) => condition.id),
  gamePlans,
};

// Everything the picker offers and the editor can open: every guild, then the generic catalog.
export const selectableCatalogs: GuildCatalog[] = [
  ...guildCatalogs,
  genericCatalog,
];
