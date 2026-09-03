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
