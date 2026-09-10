// A real, deliberately empty icon in the manifest, used wherever an icon id has to be present
// but no artwork is wanted yet: as the substitute for an id the manifest doesn't know, and as the
// placeholder the shared config carries before any guild has been selected.
export const FALLBACK_ICON_ID = "blank";

export type IconKind = "guild" | "status" | "generic";

export type IconBbox = { minX: number; minY: number; maxX: number; maxY: number };

export type ManifestEntry = {
  id: string;
  kind: IconKind;
  pathCount: number;
  bbox: IconBbox;
  aspect: number;
  needsUnion: boolean;
  overflowsEmBox: boolean;
};
