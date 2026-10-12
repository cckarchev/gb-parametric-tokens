import effectsData from "../../../data/effects.json";
import { CatalogEffect } from "./catalogTypes";
import { buildLookup, resolveById } from "./resolveById";

// A JSON import widens `layout` to plain string; effects.test.ts checks every value in the file
// against CatalogEffect's own union, so the narrowing here is backed by a real check.
const effects = effectsData as CatalogEffect[];

const effectsLookup = buildLookup<CatalogEffect>(effects, (effect) => effect.id);

export const resolveEffect = (effectId: string): CatalogEffect => {
  return resolveById(effectsLookup, effectId, "effect");
};
