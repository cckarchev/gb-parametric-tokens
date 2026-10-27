import type { GuildCatalog } from "@/core/token/catalog/catalogTypes";

import { selectableCatalogs } from "./guildCatalogs";

// Synchronous on purpose: every guild's catalog is already inlined in this
// bundle (see guildCatalogs.ts), so this is a lookup, not a load.
export const loadGuildCatalog = (guildId: string): GuildCatalog => {
  const catalog = selectableCatalogs.find((entry) => entry.guildId === guildId);

  if (!catalog) {
    throw new Error(`Failed to load catalog for guild "${guildId}"`);
  }

  return catalog;
};
