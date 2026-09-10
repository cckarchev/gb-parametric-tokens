import effectsData from "../../../data/catalog/effects.json";
import { CatalogEffect } from "./catalogTypes";
import { buildLookup, resolveById } from "./resolveById";

const effectsLookup = buildLookup<CatalogEffect>(effectsData, (effect) => effect.name);

export const resolveEffect = (effectName: string): CatalogEffect => {
  return resolveById(effectsLookup, effectName, "effect");
};
