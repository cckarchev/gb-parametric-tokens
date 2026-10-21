import { selectableCatalogs } from "./guildCatalogs";

export type AvailableGuild = {
  id: string;
  name: string;
  color: string;
  // See GuildCatalog.iconScale.
  iconScale?: number;
};

// Synchronous on purpose: Vite inlines every guild's JSON into this bundle at build time (see
// guildCatalogs.ts), so there is nothing to fetch and nothing to wait for.
export const listAvailableGuilds = (): AvailableGuild[] =>
  selectableCatalogs.map((catalog) => ({
    id: catalog.guildId,
    name: catalog.name,
    color: catalog.color,
    iconScale: catalog.iconScale,
  }));
