import effectsData from "@/data/effects.json";

import type { CatalogEffect } from "./catalogTypes";
import { buildLookup, resolveById } from "./resolveById";
import {
  CHARACTER_TOKEN_MAX_COPIES,
  MIN_COPIES,
} from "./token-items/tokenItem";

// A JSON import widens `layout` to plain string and `repeatable` to boolean;
// effects.test.ts checks every value in the file against CatalogEffect's own
// types, so the narrowing here is backed by a real check.
const effects = effectsData as CatalogEffect[];

const effectsLookup = buildLookup<CatalogEffect>(
  effects,
  (effect) => effect.id,
);

export const resolveEffect = (effectId: string): CatalogEffect =>
  resolveById(effectsLookup, effectId, "effect");

export const effectMaxCopies = (effect: CatalogEffect): number => {
  if (effect.repeatable) {
    return CHARACTER_TOKEN_MAX_COPIES;
  }

  return MIN_COPIES;
};
