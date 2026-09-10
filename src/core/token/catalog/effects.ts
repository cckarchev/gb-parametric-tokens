import effectsData from "../../../data/effects.json";
import { CatalogEffect } from "./catalogTypes";
import { buildLookup, resolveById } from "./resolveById";

const effectsLookup = buildLookup<CatalogEffect>(effectsData, (effect) => effect.name);

export const resolveEffect = (effectName: string): CatalogEffect => {
  return resolveById(effectsLookup, effectName, "effect");
};
