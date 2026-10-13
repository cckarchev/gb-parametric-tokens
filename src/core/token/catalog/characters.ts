import charactersData from "@/data/characters.json";

import { CatalogCharacter } from "./catalogTypes";
import { buildLookup, resolveById } from "./resolveById";

const charactersLookup = buildLookup<CatalogCharacter>(
  charactersData,
  (character) => character.name,
);

export const resolveCharacter = (characterName: string): CatalogCharacter => {
  return resolveById(charactersLookup, characterName, "character");
};
