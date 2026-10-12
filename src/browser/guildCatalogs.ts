import { CatalogGenericToken, GuildCatalog } from "../core/token/catalog/catalogTypes";
import { resolveCharacter } from "../core/token/catalog/characters";
import { allConditions, conditionsForGuild } from "../core/token/catalog/conditions";
import { gamePlans } from "../core/token/catalog/gamePlans";
import { GENERIC_CATALOG_ID } from "../core/token/catalog/genericCatalog";
import genericData from "../data/generic.json";

// On disk, a guild only stores which characters it has, by name, not their data -- see
// characters.ts for where that data actually lives. This is the shape Vite hands back for each
// matched JSON file, before this module resolves those names into full CatalogCharacter objects.
type RawGuildCatalog = {
  name: string;
  color: string;
  iconScale?: number;
  characters: string[];
  genericTokens: CatalogGenericToken[];
  conditions: string[];
};

// Eager (not lazy) so the guild picker can list every guild's id/name/color/iconScale up front
// without a network round trip per guild -- Vite inlines all matched JSON files into this
// module's own chunk at build time. The full per-guild data (characters, tokens) rides along
// for free since it's the same file loadGuildCatalog needs once a guild is actually selected, so
// nothing here is duplicated between "the guild list" and "a guild's own catalog".
const modules = import.meta.glob("../data/guilds/*.json", { eager: true }) as Record<
  string,
  { default: RawGuildCatalog }
>;

// The guild id is the file's own name (e.g. "brewers.json" -> "brewers"), not a field inside the
// file -- the file name was already the source of truth, so storing it a second time inside the
// file's own content could only ever drift out of sync with it.
const guildIdFromPath = (path: string): string => {
  const fileName = path.split("/").pop() ?? path;

  return fileName.replace(/\.json$/, "");
};

export const guildCatalogs: GuildCatalog[] = Object.entries(modules).map(([path, module]) => {
  const raw = module.default;
  const guildId = guildIdFromPath(path);

  return {
    guildId,
    name: raw.name,
    color: raw.color,
    iconScale: raw.iconScale,
    characters: raw.characters.map(resolveCharacter),
    genericTokens: raw.genericTokens,
    conditions: conditionsForGuild(guildId),
    appliedConditionIds: raw.conditions,
    gamePlans: [],
  };
});

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
export const selectableCatalogs: GuildCatalog[] = [...guildCatalogs, genericCatalog];
