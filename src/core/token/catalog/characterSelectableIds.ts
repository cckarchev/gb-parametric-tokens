import { CatalogCharacter } from "./catalogTypes";
import { characterAoeTemplateId, characterTokenId } from "./tokenItems/tokenItem";

// Everything a character's own checkbox selects: its tokens, then its AOE templates.
export const characterSelectableIds = (character: CatalogCharacter): string[] => {
  const tokenIds = character.effects.map((_, tokenIndex) =>
    characterTokenId(character.name, tokenIndex),
  );
  const templateIds = (character.aoeTemplates ?? []).map((_, templateIndex) =>
    characterAoeTemplateId(character.name, templateIndex),
  );

  return [...tokenIds, ...templateIds];
};
