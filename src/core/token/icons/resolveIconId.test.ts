import { describe, expect, it } from "vitest";

import type { ManifestEntry } from "./iconManifest";
import { resolveIconId } from "./resolveIconId";

const manifest: ManifestEntry[] = [
  {
    id: "Alchemists",
    kind: "guild",
    pathCount: 1,
    bbox: { minX: 0, minY: 0, maxX: 16, maxY: 16 },
    aspect: 1,
    needsUnion: false,
    overflowsEmBox: false,
  },
  {
    id: "blank",
    kind: "generic",
    pathCount: 0,
    bbox: { minX: 0, minY: 0, maxX: 16, maxY: 16 },
    aspect: 1,
    needsUnion: false,
    overflowsEmBox: false,
  },
];

describe("resolveIconId", () => {
  it("returns the iconId unchanged when it exists in the manifest", () => {
    const result = resolveIconId("Alchemists", manifest, "blank");

    expect(result).toEqual({ resolvedId: "Alchemists", substituted: false });
  });

  it("substitutes the fallback id when the iconId is not in the manifest", () => {
    const result = resolveIconId("Farmers2", manifest, "blank");

    expect(result).toEqual({ resolvedId: "blank", substituted: true });
  });

  it("returns the fallback id even when the fallback itself is not in the manifest", () => {
    const result = resolveIconId("missing", [], "blank");

    expect(result).toEqual({ resolvedId: "blank", substituted: true });
  });
});
