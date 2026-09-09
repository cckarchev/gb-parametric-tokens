import { GuildCatalog } from "../core/token/catalog/catalogTypes";

// Eager (not lazy) so the guild picker can list every guild's id/name/color/iconScale up front
// without a network round trip per guild -- Vite inlines all matched JSON files into this
// module's own chunk at build time. The full per-guild data (characters, tokens) rides along
// for free since it's the same file loadGuildCatalog needs once a guild is actually selected, so
// nothing here is duplicated between "the guild list" and "a guild's own catalog".
const modules = import.meta.glob("../data/catalog/guilds/*.json", { eager: true }) as Record<
  string,
  { default: GuildCatalog }
>;

export const guildCatalogs: GuildCatalog[] = Object.values(modules).map((module) => module.default);
