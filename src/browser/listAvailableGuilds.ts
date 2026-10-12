import { selectableCatalogs } from "./guildCatalogs";

export type AvailableGuild = {
  id: string;
  name: string;
  color: string;
  // Multiplies the guild's icon size on top of the shared base size in GuildSelector, for the
  // rare crest that still needs a manual nudge after its SVG's viewBox is cropped to its own ink
  // bounding box (e.g. an asymmetric crest that reads a touch small once letterboxed into a
  // square badge). Sourced from the guild's own catalog file (see GuildCatalog.iconScale) so it
  // isn't duplicated here. Optional; defaults to 1 (no change) when omitted.
  iconScale?: number;
};

// Synchronous on purpose: Vite inlines every guild's JSON into this bundle at build time (see
// guildCatalogs.ts), so there is nothing to fetch and nothing to wait for.
export const listAvailableGuilds = (): AvailableGuild[] => {
  return selectableCatalogs.map((catalog) => ({
    id: catalog.guildId,
    name: catalog.name,
    color: catalog.color,
    iconScale: catalog.iconScale,
  }));
};
