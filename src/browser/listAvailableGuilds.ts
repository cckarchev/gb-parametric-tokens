export type AvailableGuild = { id: string; name: string };

const GUILD_INDEX_URL = "/catalog/index.json";

export const listAvailableGuilds = async (): Promise<AvailableGuild[]> => {
  const response = await fetch(GUILD_INDEX_URL);

  if (!response.ok) {
    throw new Error(`Failed to load guild index: ${response.statusText}`);
  }

  return response.json();
};
