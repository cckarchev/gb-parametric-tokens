import { estimateAscentMm } from "../computeArcReliefComponents";
import { ArcShapeSpec, DiscShapeSpec } from "../geometry/studPlacement";
import {
  ColorGroupSpec,
  FitPolicy,
  IconOverflowBehavior,
  IconSpec,
  StyleSpec,
  TokenSpec,
} from "../types";
import { CatalogEffect, CatalogGenericToken, GuildCatalog } from "./catalogTypes";
import { TEXT_COLOR_GROUP_ID } from "./deriveReliefColor";
import { resolveEffect } from "./effects";

export type TokenItem = {
  id: string;
  label: string;
  // The character a token belongs to, undefined for anything that isn't a character token
  // (guild generics, Influence, Momentum, Goal Influence) -- lets the "needs attention" list
  // group a character's tokens together instead of repeating their name on every line.
  group?: string;
  name: string;
  spec: TokenSpec;
  copies: number;
};

// Shared by every guild-level counter (Influence, Momentum, Goal Influence, and each generic
// token): whether it's included in the run at all, plus how many copies to print once it is.
// Kept as one object (not a separate enabled-map alongside a copies-map) so a single field can't
// drift out of sync with its own counter. `copies` is left untouched while `enabled` is false, so
// re-checking a counter restores its last count instead of resetting to the field's minimum --
// the same behavior characterTokenCopies already has for character tokens (see below).
export type CounterSelection = { enabled: boolean; copies: number };

export type TokenSelection = {
  characterTokenIds: string[];
  // Copies for a selected character token whose catalog entry sets maxCopies > 1. Not consulted
  // for tokens with no maxCopies (those always print 1 copy) and left untouched when a token is
  // deselected, so re-selecting it restores the count instead of resetting to 1.
  characterTokenCopies: Record<string, number>;
  genericTokens: Record<string, CounterSelection>;
  influence: CounterSelection;
  momentum: CounterSelection;
  goalInfluence: CounterSelection;
};

export type SharedConfig = {
  arcShape: ArcShapeSpec;
  discShape: DiscShapeSpec;
  goalInfluenceShape: DiscShapeSpec;
  style: StyleSpec;
  fitPolicy: FitPolicy;
  printProfileId: string;
  colorGroups: ColorGroupSpec[];
  influenceIconId: string;
  nameSizeMm: number;
  effectSizeMm: number;
  showSecondLine: boolean;
  balanceTwoLineSizes: boolean;
  // "none" by default: applied to every guild icon this catalog builds (see buildIconSpec below)
  // -- see IconOverflowBehavior in types.ts for what each value does.
  iconOverflowBehavior: IconOverflowBehavior;
};

const DEFAULT_ICON_SCALE = 0.85;
// "MP" (Momentum Points) is the text printed on the Momentum token itself -- not a separate
// token kind, see [[batch-grid-and-tokens-2026-09-02]].
const MOMENTUM_TEXT = "MP";
const MOMENTUM_TEXT_SIZE_MM = 6;
const MOMENTUM_FIT_POLICY: FitPolicy = {
  minTracking: 0,
  maxTracking: 0,
  minScale: 1,
  allowTwoLines: false,
};

// Not physically calibrated (see arc-ribbon-parametrization's precedent for this project's
// disc/arc shape defaults): a starting point for a thin border ring, proportional to the
// disc's own diameter so it tracks that shape's default if it ever changes. Shared by every
// token that wears a plain ring (Momentum, Goal Influence's border) -- tune by feel / real
// render, same as every other geometry default in this app.
const RING_RADIUS_RATIO = 0.85;
const RING_WIDTH_MM = 0.6;

// Starting point for balanceTwoLineSizes, tunable by feel against a real render like every other
// geometry/typography default in this app: shrinks the name a touch and grows the effect text so
// a two-line character token reads more evenly instead of the effect text looking like an
// afterthought.
const TWO_LINE_NAME_BALANCE_SCALE = 0.9;
const TWO_LINE_EFFECT_BALANCE_SCALE = 1.2;

// Moved outward from its old 0.55 now that Goal Influence no longer wears a ring border (see
// buildGoalInfluenceTokenSpec below): the space that border used to occupy is free for the text
// to use instead.
const GOAL_INFLUENCE_TEXT_RADIUS_RATIO = 0.75;
const GOAL_INFLUENCE_TEXT_SIZE_MM = 2.2;
// Up from 0.35 (originally raised to 0.55, then further by user feedback): that low value was
// sized to squeeze between a ring border and the text, both of which the icon no longer has to
// share room with as tightly (the ring is gone, the text moved out). A crest this small was hard
// to print cleanly. Kept under GOAL_INFLUENCE_TEXT_RADIUS_RATIO (0.75) at guildIconScale 1 so
// there's still a margin before the icon's own edge reaches the text at the default scale.
const GOAL_INFLUENCE_ICON_SCALE = 0.65;
const GOAL_INFLUENCE_TOP_TEXT = "Goal";
const GOAL_INFLUENCE_BOTTOM_TEXT = "Influence";

export const characterTokenId = (characterId: string, tokenIndex: number): string => {
  return `${characterId}-${tokenIndex}`;
};

// Every icon a guild token wears goes through here, so iconOverflowBehavior only needs to be
// threaded once: when it's "none" (the default), the built IconSpec looks exactly as it always
// has, so no overflow correction ever runs even though it's still flagged for attention.
const buildIconSpec = (
  iconId: string,
  side: IconSpec["side"],
  scale: number,
  sharedConfig: SharedConfig,
): IconSpec => ({
  iconId,
  side,
  scale,
  colorGroup: TEXT_COLOR_GROUP_ID,
  ...(sharedConfig.iconOverflowBehavior !== "none"
    ? { overflowBehavior: sharedConfig.iconOverflowBehavior }
    : {}),
});

// Every token spec carries the same trailing style/printing fields from the shared config,
// whatever its own shape, text, icons, and decorations look like.
const sharedTokenFields = (
  sharedConfig: SharedConfig,
): Pick<TokenSpec, "style" | "colorGroups" | "printProfileId" | "fitPolicy"> => {
  return {
    style: sharedConfig.style,
    colorGroups: sharedConfig.colorGroups,
    printProfileId: sharedConfig.printProfileId,
    fitPolicy: sharedConfig.fitPolicy,
  };
};

// The catalog's iconScale (see GuildCatalog) only makes sense for the guild's own crest, so a
// token wearing a custom icon of its own is left at the plain default.
const guildCrestScale = (iconId: string, guildIconId: string, guildIconScale: number): number => {
  return iconId === guildIconId ? guildIconScale : 1;
};

const buildCharacterTokenSpec = (
  effect: CatalogEffect,
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const iconScale = DEFAULT_ICON_SCALE * guildIconScale;
  const secondLineText = sharedConfig.showSecondLine ? effect.effect : undefined;

  const nameSizeMm =
    secondLineText !== undefined && sharedConfig.balanceTwoLineSizes
      ? sharedConfig.nameSizeMm * TWO_LINE_NAME_BALANCE_SCALE
      : sharedConfig.nameSizeMm;

  const nameLine = {
    text: effect.name,
    sizeMm: nameSizeMm,
    colorGroup: TEXT_COLOR_GROUP_ID,
  };

  const lines =
    secondLineText !== undefined
      ? [
          nameLine,
          {
            text: secondLineText,
            sizeMm: sharedConfig.balanceTwoLineSizes
              ? sharedConfig.effectSizeMm * TWO_LINE_EFFECT_BALANCE_SCALE
              : sharedConfig.effectSizeMm,
            colorGroup: TEXT_COLOR_GROUP_ID,
          },
        ]
      : [nameLine];

  return {
    version: 1,
    shape: sharedConfig.arcShape,
    textLayout: "arc",
    lines,
    icons: [
      buildIconSpec(guildIconId, "left", iconScale, sharedConfig),
      buildIconSpec(guildIconId, "right", iconScale, sharedConfig),
    ],
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};

const buildGenericTokenSpec = (
  generic: CatalogGenericToken,
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const iconId = generic.iconId ?? guildIconId;
  const iconScale = DEFAULT_ICON_SCALE * guildCrestScale(iconId, guildIconId, guildIconScale);

  return {
    version: 1,
    shape: sharedConfig.discShape,
    textLayout: "flat",
    lines: [],
    icons: [buildIconSpec(iconId, "center", iconScale, sharedConfig)],
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};

// A plain thin ring, shared by Momentum's own border and Goal Influence's border.
const buildRingDecoration = (discShape: DiscShapeSpec) => {
  const radiusMm = (discShape.diameterMm / 2) * RING_RADIUS_RATIO;

  return {
    type: "ring" as const,
    radiusMm,
    widthMm: RING_WIDTH_MM,
    colorGroup: TEXT_COLOR_GROUP_ID,
  };
};

const buildGoalInfluenceTokenSpec = (
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const discRadiusMm = sharedConfig.goalInfluenceShape.diameterMm / 2;
  const topTextRadiusMm = discRadiusMm * GOAL_INFLUENCE_TEXT_RADIUS_RATIO;
  // "Goal" (top) reads outward, so its ink grows past topTextRadiusMm; "Influence" (bottom)
  // reads inward (see computeRingReliefComponents.ts's orientation doc comment), so its ink
  // grows back toward its own radius from further out. Pushing the bottom radius out by one
  // ascent makes both lines' ink line up at the same distance from center instead of
  // "Influence" reading closer to the icon than "Goal" reads to the rim.
  const bottomTextRadiusMm = topTextRadiusMm + estimateAscentMm(GOAL_INFLUENCE_TEXT_SIZE_MM);

  return {
    version: 1,
    shape: sharedConfig.goalInfluenceShape,
    textLayout: "ring",
    lines: [
      {
        text: GOAL_INFLUENCE_TOP_TEXT,
        sizeMm: GOAL_INFLUENCE_TEXT_SIZE_MM,
        radiusMm: topTextRadiusMm,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
      {
        text: GOAL_INFLUENCE_BOTTOM_TEXT,
        sizeMm: GOAL_INFLUENCE_TEXT_SIZE_MM,
        radiusMm: bottomTextRadiusMm,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
    ],
    icons: [
      buildIconSpec(
        guildIconId,
        "center",
        GOAL_INFLUENCE_ICON_SCALE * guildIconScale,
        sharedConfig,
      ),
    ],
    // No ring border here (unlike Momentum, see buildMomentumTokenSpec): that border was
    // designed around the old, circular Guild Ball logo this token used to wear at its center.
    // A guild's own crest isn't circular, so the ring next to it read as a redundant "double
    // circle" instead of one clean badge.
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};

// A single, identical, unnumbered token -- the selection's copies count is the physical
// quantity to print, not a range of distinct values (see [[batch-grid-and-tokens-2026-09-02]]
// in memory for why Influence/Momentum moved away from a numbered-per-value design).
// influenceIconId is always the current guild's own crest (see useTokenGenerator.ts, which
// seeds it from catalog.name on every guild load), so it earns the same guildIconScale
// treatment as a character or generic token's crest.
const buildInfluenceTokenSpec = (
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const iconScale =
    DEFAULT_ICON_SCALE * guildCrestScale(sharedConfig.influenceIconId, guildIconId, guildIconScale);

  return {
    version: 1,
    shape: sharedConfig.discShape,
    textLayout: "flat",
    lines: [],
    icons: [buildIconSpec(sharedConfig.influenceIconId, "center", iconScale, sharedConfig)],
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};

// Fixed text "MP" (Momentum Points) plus a thin border ring, no icon -- a physical chip you
// stack to count Momentum, not a token that reads its own numeric value.
const buildMomentumTokenSpec = (sharedConfig: SharedConfig): TokenSpec => {
  return {
    version: 1,
    shape: sharedConfig.discShape,
    textLayout: "flat",
    lines: [
      { text: MOMENTUM_TEXT, sizeMm: MOMENTUM_TEXT_SIZE_MM, colorGroup: TEXT_COLOR_GROUP_ID },
    ],
    icons: [],
    decorations: [buildRingDecoration(sharedConfig.discShape)],
    ...sharedTokenFields(sharedConfig),
    fitPolicy: MOMENTUM_FIT_POLICY,
  };
};

export const buildTokenItems = (
  catalog: GuildCatalog,
  selection: TokenSelection,
  sharedConfig: SharedConfig,
): TokenItem[] => {
  const guildIconId = catalog.name;
  const guildIconScale = catalog.iconScale ?? 1;
  const items: TokenItem[] = [];

  for (const character of catalog.characters) {
    character.effects.forEach((effectName, tokenIndex) => {
      const id = characterTokenId(character.name, tokenIndex);

      if (!selection.characterTokenIds.includes(id)) {
        return;
      }

      const effect = resolveEffect(effectName);
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
