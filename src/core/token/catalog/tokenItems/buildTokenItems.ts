import { GuildCatalog } from "../catalogTypes";
import { resolveEffect } from "../effects";
import { buildCharacterTokenSpec } from "./characterTokenSpec";
import { buildGenericTokenSpec } from "./genericTokenSpec";
import { buildGoalInfluenceTokenSpec } from "./goalInfluenceTokenSpec";
import { buildInfluenceTokenSpec } from "./influenceTokenSpec";
import { buildMomentumTokenSpec } from "./momentumTokenSpec";
import { characterTokenId, SharedConfig, TokenItem, TokenSelection } from "./tokenItem";

export const buildTokenItems = (
  catalog: GuildCatalog,
  selection: TokenSelection,
  sharedConfig: SharedConfig,
): TokenItem[] => {
  const guildIconId = catalog.name;
  const guildIconScale = catalog.iconScale ?? 1;
  const items: TokenItem[] = [];

  for (const character of catalog.characters) {
    character.effects.forEach((effectId, tokenIndex) => {
      const id = characterTokenId(character.name, tokenIndex);

      if (!selection.characterTokenIds.includes(id)) {
        return;
      }

      const effect = resolveEffect(effectId);
      const copies =
        effect.maxCopies && effect.maxCopies > 1 ? (selection.characterTokenCopies[id] ?? 1) : 1;

      items.push({
        id,
        label: `${character.name}: ${effect.name}`,
        group: character.name,
        name: effect.name,
        spec: buildCharacterTokenSpec(effect, guildIconId, guildIconScale, sharedConfig),
        copies,
      });
    });
  }

  for (const generic of catalog.genericTokens) {
    const counter = selection.genericTokens[generic.name];

    if (!counter?.enabled) {
      continue;
    }

    items.push({
      id: generic.name,
      label: generic.name,
      name: generic.name,
      spec: buildGenericTokenSpec(generic, guildIconId, guildIconScale, sharedConfig),
      copies: counter.copies,
    });
  }

  if (selection.influence.enabled) {
    items.push({
      id: "influence",
      label: "Influence",
      name: "Influence",
      spec: buildInfluenceTokenSpec(guildIconId, guildIconScale, sharedConfig),
      copies: selection.influence.copies,
    });
  }

  if (selection.momentum.enabled) {
    items.push({
      id: "momentum",
      label: "Momentum",
      name: "Momentum",
      spec: buildMomentumTokenSpec(sharedConfig),
      copies: selection.momentum.copies,
    });
  }

  if (selection.goalInfluence.enabled) {
    items.push({
      id: "goal-influence",
      label: "Goal Influence",
      name: "Goal Influence",
      spec: buildGoalInfluenceTokenSpec(guildIconId, guildIconScale, sharedConfig),
      copies: selection.goalInfluence.copies,
    });
  }

  return items;
};
