import { GuildCatalog } from "../core/token/catalog/catalogTypes";
import { guildCatalogs } from "./guildCatalogs";

export const loadGuildCatalog = async (guildId: string): Promise<GuildCatalog> => {
  const catalog = guildCatalogs.find((entry) => entry.guildId === guildId);

  if (!catalog) {
    throw new Error(`Failed to load catalog for guild "${guildId}"`);
  }

  return catalog;
};
