import { ManifestEntry } from "./iconManifest";

// Where an icon's file actually lives under /icons/, derived from its manifest kind rather than
// stored per entry: guild crests are nested per guild (room for that guild's own alternates
// later), condition markers get their own folder, and everything else stays at the root.
export const resolveIconPath = (entry: ManifestEntry): string => {
  if (entry.kind === "guild") {
    return `guilds/${entry.id}/logo.svg`;
  }

  if (entry.kind === "status") {
    return `conditions/${entry.id}.svg`;
  }

  return `${entry.id}.svg`;
};
