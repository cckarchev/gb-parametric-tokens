import index from "../data/catalog/index.json";

export type AvailableGuild = {
  id: string;
  name: string;
  color: string;
  // Multiplies the guild's icon size on top of the shared base size in GuildSelector, for the
  // rare crest that still needs a manual nudge after its SVG's viewBox is cropped to its own ink
  // bounding box (e.g. an asymmetric crest that reads a touch small once letterboxed into a
  // square badge). Optional; defaults to 1 (no change) when omitted.
  iconScale?: number;
};

export const listAvailableGuilds = async (): Promise<AvailableGuild[]> => {
  return index;
};
