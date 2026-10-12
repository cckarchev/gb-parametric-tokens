import effectsData from "../../../data/effects.json";
import { CatalogEffect } from "./catalogTypes";
import { buildLookup, resolveById } from "./resolveById";

const effectsLookup = buildLookup<CatalogEffect>(effectsData, (effect) => effect.id);

export const resolveEffect = (effectId: string): CatalogEffect => {
  return resolveById(effectsLookup, effectId, "effect");
};
