import { describe, expect, it } from "vitest";

import { ManifestEntry } from "./iconManifest";
import { resolveIconPath } from "./resolveIconPath";

const entry = (id: string, kind: ManifestEntry["kind"]): ManifestEntry => ({
  id,
  kind,
  pathCount: 1,
  bbox: { minX: 0, minY: 0, maxX: 16, maxY: 16 },
  aspect: 1,
  needsUnion: false,
  overflowsEmBox: false,
});

describe("resolveIconPath", () => {
  it("nests a guild icon under guilds/<id>/logo.svg", () => {
    expect(resolveIconPath(entry("Alchemists", "guild"))).toBe("guilds/Alchemists/logo.svg");
  });

  it("nests a status icon under conditions/<id>.svg", () => {
    expect(resolveIconPath(entry("bleeding", "status"))).toBe("conditions/bleeding.svg");
  });

  it("keeps a generic icon at the root as <id>.svg", () => {
    expect(resolveIconPath(entry("blank", "generic"))).toBe("blank.svg");
  });
});
