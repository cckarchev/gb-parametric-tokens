import { resolveAoeTemplate } from "../aoeTemplates";
import type { CatalogCharacter, GuildCatalog } from "../catalogTypes";
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
  type SharedConfig,
  type TokenItem,
  type TokenSelection,
} from "./tokenItem";

// What every item builder below needs besides its own catalog entries.
type ItemContext = {
  selection: TokenSelection;
  sharedConfig: SharedConfig;
  guildIconId: string;
  guildIconScale: number;
};

const characterEffectItems = (
  character: CatalogCharacter,
  { selection, sharedConfig, guildIconId, guildIconScale }: ItemContext,
): TokenItem[] => {
  const effects = character.effects.map(resolveEffect);
  const effectLabels = buildEffectLabels(effects);

  return effects.flatMap((effect, tokenIndex) => {
    const id = characterTokenId(character.name, tokenIndex);

    if (!selection.characterTokenIds.includes(id)) {
      return [];
    }

    const effectLabel = effectLabels[tokenIndex];
    const copies = resolveTokenCopies(
      selection.characterTokenCopies[id],
      effectMaxCopies(effect),
    );

    return [
      {
        id,
        label: `${character.name}: ${effectLabel}`,
        group: character.name,
        name: effectLabel,
        spec: buildCharacterTokenSpec(
          effect,
          guildIconId,
          guildIconScale,
          sharedConfig,
        ),
        copies,
      },
    ];
  });
};

const characterTemplateItems = (
  character: CatalogCharacter,
  { selection, sharedConfig, guildIconId, guildIconScale }: ItemContext,
): TokenItem[] => {
  const templates = (character.aoeTemplates ?? []).map(resolveAoeTemplate);

  return templates.flatMap((template, templateIndex) => {
    const id = characterAoeTemplateId(character.name, templateIndex);

    if (!selection.characterTokenIds.includes(id)) {
      return [];
    }

    const templateMaxCopies = template.maxCopies ?? MIN_COPIES;
    const copies = resolveTokenCopies(
      selection.characterTokenCopies[id],
      templateMaxCopies,
    );

    // Some abilities are both a reminder token and a template (Ebb's Sprung a
    // Leak, vCalculus's Sticky Bomb), so outside the picker's own "AOE
    // templates" subheading the template needs its own marker to stay
    // distinguishable in the attention list and export failures.
    const templateName = `${template.name} (AOE)`;

    return [
      {
        id,
        label: `${character.name}: ${templateName}`,
        group: character.name,
        name: templateName,
        spec: buildAoeTemplateSpec(
          template,
          guildIconId,
          guildIconScale,
          sharedConfig,
        ),
        copies,
      },
    ];
  });
};

const gamePlanItems = (
  catalog: GuildCatalog,
  { selection, sharedConfig, guildIconId, guildIconScale }: ItemContext,
): TokenItem[] =>
  catalog.gamePlans.flatMap((gamePlan) => {
    const counter = selection.gamePlans[gamePlan.id];

    if (!counter?.enabled) {
      return [];
    }

    // Structurally a character effect (name plus the effect line below it), so
    // it is printed as the same arc token, wearing the catalog's own crest.
    return [
      {
        id: gamePlanTokenId(gamePlan.id),
        label: gamePlan.name,
        name: gamePlan.name,
        spec: buildCharacterTokenSpec(
          gamePlan,
          guildIconId,
          guildIconScale,
          sharedConfig,
        ),
        copies: counter.copies,
      },
    ];
  });

// Influence, Momentum and Goal Influence: one counter each, in that order.
const guildCounterItems = ({
  selection,
  sharedConfig,
  guildIconId,
  guildIconScale,
}: ItemContext): TokenItem[] => {
  const items: TokenItem[] = [];

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
      spec: buildGoalInfluenceTokenSpec(
        guildIconId,
        guildIconScale,
        sharedConfig,
      ),
      copies: selection.goalInfluence.copies,
    });
  }

  return items;
};

const genericItems = (
  catalog: GuildCatalog,
  { selection, sharedConfig, guildIconId, guildIconScale }: ItemContext,
): TokenItem[] =>
  catalog.genericTokens.flatMap((generic) => {
    const counter = selection.genericTokens[generic.name];

    if (!counter?.enabled) {
      return [];
    }

    return [
      {
        id: generic.name,
        label: generic.name,
        name: generic.name,
        spec: buildGenericTokenSpec(
          generic,
          guildIconId,
          guildIconScale,
          sharedConfig,
        ),
        copies: counter.copies,
      },
    ];
  });

const conditionItems = (
  catalog: GuildCatalog,
  { selection, sharedConfig }: ItemContext,
): TokenItem[] =>
  catalog.conditions.flatMap((condition) => {
    const counter = selection.conditions[condition.id];

    if (!counter?.enabled) {
      return [];
    }

    return [
      {
        id: conditionTokenId(condition.id),
        label: condition.name,
        name: condition.name,
        spec: buildConditionTokenSpec(condition, sharedConfig),
        copies: counter.copies,
      },
    ];
  });

export const buildTokenItems = (
  catalog: GuildCatalog,
  selection: TokenSelection,
  sharedConfig: SharedConfig,
): TokenItem[] => {
  const context: ItemContext = {
    selection,
    sharedConfig,
    guildIconId: catalog.name,
    guildIconScale: catalog.iconScale ?? 1,
  };

  const rosterItems = catalog.characters.flatMap((character) => [
    ...characterEffectItems(character, context),
    ...characterTemplateItems(character, context),
  ]);

  // Same order as the editor's panels: the roster (or, in the generic catalog,
  // the Game Plans in its spot), the guild tokens, then the conditions.
  return [
    ...rosterItems,
    ...gamePlanItems(catalog, context),
    ...guildCounterItems(context),
    ...genericItems(catalog, context),
    ...conditionItems(catalog, context),
  ];
};
