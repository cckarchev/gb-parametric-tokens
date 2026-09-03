import { GuildCatalog } from "../core/token/catalog/catalogTypes";

export const loadGuildCatalog = async (guildId: string): Promise<GuildCatalog> => {
  const response = await fetch(`/catalog/${guildId}.json`);

  if (!response.ok) {
    throw new Error(`Failed to load catalog for guild "${guildId}": ${response.statusText}`);
  }

  return response.json();
};
