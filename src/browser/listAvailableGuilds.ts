import index from "../data/catalog/index.json";

export type AvailableGuild = { id: string; name: string };

export const listAvailableGuilds = async (): Promise<AvailableGuild[]> => {
  return index;
};
