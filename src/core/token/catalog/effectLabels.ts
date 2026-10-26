import type { CatalogEffect } from "./catalogTypes";

// One ability can offer several outcomes, each its own effect sharing the
// ability's printed name (see CatalogEffect), so a character's list would show
// the same label twice. Only those repeated names get their effect text
// appended; every other label stays the plain name.
export const buildEffectLabels = (effects: CatalogEffect[]): string[] => {
  const countByName = new Map<string, number>();

  for (const effect of effects) {
    countByName.set(effect.name, (countByName.get(effect.name) ?? 0) + 1);
  }

  return effects.map((effect) => {
    const nameRepeats = (countByName.get(effect.name) ?? 0) > 1;

    if (!nameRepeats || effect.effect === undefined) {
      return effect.name;
    }

    return `${effect.name} (${effect.effect})`;
  });
};
