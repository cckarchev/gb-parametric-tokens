import { resolveAoeTemplate } from "../aoeTemplates";
import { GuildCatalog } from "../catalogTypes";
import { buildEffectLabels } from "../effectLabels";
import { resolveEffect } from "../effects";
import { buildAoeTemplateSpec } from "./aoeTemplateSpec";
import { buildCharacterTokenSpec } from "./characterTokenSpec";
import { buildGenericTokenSpec } from "./genericTokenSpec";
import { buildGoalInfluenceTokenSpec } from "./goalInfluenceTokenSpec";
import { buildInfluenceTokenSpec } from "./influenceTokenSpec";
import { buildMomentumTokenSpec } from "./momentumTokenSpec";
import {
  characterAoeTemplateId,
  characterTokenId,
  SharedConfig,
  TokenItem,
  TokenSelection,
} from "./tokenItem";

export const buildTokenItems = (
  catalog: GuildCatalog,
  selection: TokenSelection,
  sharedConfig: SharedConfig,
): TokenItem[] => {
  const guildIconId = catalog.name;
  const guildIconScale = catalog.iconScale ?? 1;
  const items: TokenItem[] = [];

  for (const character of catalog.characters) {
    const effects = character.effects.map(resolveEffect);
    const effectLabels = buildEffectLabels(effects);

    effects.forEach((effect, tokenIndex) => {
      const id = characterTokenId(character.name, tokenIndex);

      if (!selection.characterTokenIds.includes(id)) {
        return;
      }

      const effectLabel = effectLabels[tokenIndex];
      const copies =
        effect.maxCopies && effect.maxCopies > 1 ? (selection.characterTokenCopies[id] ?? 1) : 1;

      items.push({
        id,
        label: `${character.name}: ${effectLabel}`,
        group: character.name,
        name: effectLabel,
        spec: buildCharacterTokenSpec(effect, guildIconId, guildIconScale, sharedConfig),
        copies,
      });
    });

    const templates = (character.aoeTemplates ?? []).map(resolveAoeTemplate);

    templates.forEach((template, templateIndex) => {
      const id = characterAoeTemplateId(character.name, templateIndex);

      if (!selection.characterTokenIds.includes(id)) {
        return;
      }

      const copies =
        template.maxCopies && template.maxCopies > 1
          ? (selection.characterTokenCopies[id] ?? 1)
          : 1;

      // Some abilities are both a reminder token and a template (Ebb's Sprung a Leak, vCalculus's
      // Sticky Bomb), so outside the picker's own "AOE templates" subheading the template needs
      // its own marker to stay distinguishable in the attention list and export failures.
      const templateName = `${template.name} (AOE)`;

      items.push({
        id,
        label: `${character.name}: ${templateName}`,
        group: character.name,
        name: templateName,
        spec: buildAoeTemplateSpec(template, sharedConfig),
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
