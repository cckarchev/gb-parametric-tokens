import { describe, expect, it } from "vitest";

import type { CatalogEffect } from "./catalogTypes";
import { buildEffectLabels } from "./effectLabels";

describe("buildEffectLabels", () => {
  it("uses the plain name for an effect whose name is unique within the list", () => {
    const effects: CatalogEffect[] = [
      { id: "impetus", name: "Impetus", effect: "+1 DMG" },
      { id: "goad", name: "Goad" },
    ];

    expect(buildEffectLabels(effects)).toEqual(["Impetus", "Goad"]);
  });

  it("appends the effect text to every effect sharing a name with another one in the list", () => {
    const effects: CatalogEffect[] = [
      { id: "impetus", name: "Impetus", effect: "+1 DMG" },
      { id: "hammerTimeDmg", name: "Hammer Time!", effect: "+1 DMG" },
      { id: "hammerTimeMov", name: "Hammer Time!", effect: '+2"/+2" MOV' },
    ];

    expect(buildEffectLabels(effects)).toEqual([
      "Impetus",
      "Hammer Time! (+1 DMG)",
      'Hammer Time! (+2"/+2" MOV)',
    ]);
  });

  it("leaves a repeated name without effect text as the plain name", () => {
    const effects: CatalogEffect[] = [
      { id: "a", name: "Same" },
      { id: "b", name: "Same", effect: "+1 TAC" },
    ];

    expect(buildEffectLabels(effects)).toEqual(["Same", "Same (+1 TAC)"]);
  });
});
