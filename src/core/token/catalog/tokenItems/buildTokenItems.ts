import { resolveAoeTemplate } from "../aoeTemplates";
import { GuildCatalog } from "../catalogTypes";
import { buildEffectLabels } from "../effectLabels";
import { effectMaxCopies, resolveEffect } from "../effects";
import { buildAoeTemplateSpec } from "./aoeTemplateSpec";
import { buildCharacterTokenSpec } from "./characterTokenSpec";
import { buildConditionTokenSpec } from "./conditionTokenSpec";
import { buildGenericTokenSpec } from "./genericTokenSpec";
import { buildGoalInfluenceTokenSpec } from "./goalInfluenceTokenSpec";
import { buildInfluenceTokenSpec } from "./influenceTokenSpec";
import { buildMomentumTokenSpec } from "./momentumTokenSpec";
import { resolveTokenCopies } from "./resolveTokenCopies";
import {
  characterAoeTemplateId,
  characterTokenId,
  conditionTokenId,
  gamePlanTokenId,
  MIN_COPIES,
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
      const copies = resolveTokenCopies(
        selection.characterTokenCopies[id],
        effectMaxCopies(effect),
      );

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

      const templateMaxCopies = template.maxCopies ?? MIN_COPIES;
      const copies = resolveTokenCopies(selection.characterTokenCopies[id], templateMaxCopies);

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

  for (const condition of catalog.conditions) {
    const counter = selection.conditions[condition.id];

    if (!counter?.enabled) {
      continue;
    }

    items.push({
      id: conditionTokenId(condition.id),
      label: condition.name,
      name: condition.name,
      spec: buildConditionTokenSpec(condition, sharedConfig),
      copies: counter.copies,
    });
  }

  for (const gamePlan of catalog.gamePlans) {
    const counter = selection.gamePlans[gamePlan.id];

    if (!counter?.enabled) {
      continue;
    }

    // Structurally a character effect (name plus the effect line below it), so it is printed as
    // the same arc token, wearing the catalog's own crest.
    items.push({
      id: gamePlanTokenId(gamePlan.id),
      label: gamePlan.name,
      name: gamePlan.name,
      spec: buildCharacterTokenSpec(gamePlan, guildIconId, guildIconScale, sharedConfig),
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
