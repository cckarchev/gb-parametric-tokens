import charactersData from "@/data/characters.json";

import type { CatalogCharacter } from "./catalogTypes";
import { buildLookup, resolveById } from "./resolveById";

const charactersLookup = buildLookup<CatalogCharacter>(
  charactersData,
  (character) => character.name,
);

export const resolveCharacter = (characterName: string): CatalogCharacter =>
  resolveById(charactersLookup, characterName, "character");
