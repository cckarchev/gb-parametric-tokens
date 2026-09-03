import { GuildCatalog } from "../core/token/catalog/catalogTypes";

export const loadGuildCatalog = async (guildId: string): Promise<GuildCatalog> => {
  try {
    const module = await import(`../data/catalog/guilds/${guildId}.json`);

    return module.default;
  } catch {
    throw new Error(`Failed to load catalog for guild "${guildId}"`);
  }
};
