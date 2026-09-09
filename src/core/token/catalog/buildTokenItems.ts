import { ArcShapeSpec, DiscShapeSpec } from "../geometry/nobPlacement";
import { ColorGroupSpec, FitPolicy, StyleSpec, TokenSpec } from "../types";
import { CatalogGenericToken, CatalogTokenSpec, GuildCatalog } from "./catalogTypes";
import { TEXT_COLOR_GROUP_ID } from "./deriveReliefColor";

export type TokenItem = { id: string; label: string; spec: TokenSpec; copies: number };

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
  titleSizeMm: number;
  subtitleSizeMm: number;
  showSecondLine: boolean;
  balanceTwoLineSizes: boolean;
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
// geometry/typography default in this app: shrinks the title a touch and grows the subtitle so a
// two-line character token reads more evenly instead of the subtitle looking like an afterthought.
const TWO_LINE_TITLE_BALANCE_SCALE = 0.9;
const TWO_LINE_SUBTITLE_BALANCE_SCALE = 1.2;

const GOAL_INFLUENCE_TEXT_RADIUS_RATIO = 0.55;
const GOAL_INFLUENCE_TEXT_SIZE_MM = 2.2;
const GOAL_INFLUENCE_ICON_SCALE = 0.35;
const GOAL_INFLUENCE_TOP_TEXT = "Goal";
const GOAL_INFLUENCE_BOTTOM_TEXT = "Influence";

export const characterTokenId = (characterId: string, tokenIndex: number): string => {
  return `${characterId}-${tokenIndex}`;
};

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

const buildCharacterTokenSpec = (
  token: CatalogTokenSpec,
  guildIconId: string,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const iconId = token.iconId ?? guildIconId;
  const secondLineText = sharedConfig.showSecondLine ? token.subtitle : undefined;

  const titleSizeMm =
    secondLineText !== undefined && sharedConfig.balanceTwoLineSizes
      ? sharedConfig.titleSizeMm * TWO_LINE_TITLE_BALANCE_SCALE
      : sharedConfig.titleSizeMm;

  const titleLine = {
    text: token.title,
    sizeMm: titleSizeMm,
    colorGroup: TEXT_COLOR_GROUP_ID,
  };

  const lines =
    secondLineText !== undefined
      ? [
          titleLine,
          {
            text: secondLineText,
            sizeMm: sharedConfig.balanceTwoLineSizes
              ? sharedConfig.subtitleSizeMm * TWO_LINE_SUBTITLE_BALANCE_SCALE
              : sharedConfig.subtitleSizeMm,
            colorGroup: TEXT_COLOR_GROUP_ID,
          },
        ]
      : [titleLine];

  return {
    version: 1,
    shape: sharedConfig.arcShape,
    textLayout: "arc",
    lines,
    icons: [
      { iconId, side: "left", scale: DEFAULT_ICON_SCALE, colorGroup: TEXT_COLOR_GROUP_ID },
      { iconId, side: "right", scale: DEFAULT_ICON_SCALE, colorGroup: TEXT_COLOR_GROUP_ID },
    ],
    decorations: [],
    ...sharedTokenFields(sharedConfig),
  };
};

const buildGenericTokenSpec = (
  generic: CatalogGenericToken,
  guildIconId: string,
  sharedConfig: SharedConfig,
): TokenSpec => {
  return {
    version: 1,
    shape: sharedConfig.discShape,
    textLayout: "flat",
    lines: [],
    icons: [
      {
        iconId: generic.iconId ?? guildIconId,
        side: "center",
        scale: DEFAULT_ICON_SCALE,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
    ],
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
  sharedConfig: SharedConfig,
): TokenSpec => {
  const discRadiusMm = sharedConfig.goalInfluenceShape.diameterMm / 2;
  const textRadiusMm = discRadiusMm * GOAL_INFLUENCE_TEXT_RADIUS_RATIO;

  return {
    version: 1,
    shape: sharedConfig.goalInfluenceShape,
    textLayout: "ring",
    lines: [
      {
        text: GOAL_INFLUENCE_TOP_TEXT,
        sizeMm: GOAL_INFLUENCE_TEXT_SIZE_MM,
        radiusMm: textRadiusMm,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
      {
        text: GOAL_INFLUENCE_BOTTOM_TEXT,
        sizeMm: GOAL_INFLUENCE_TEXT_SIZE_MM,
        radiusMm: textRadiusMm,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
    ],
    icons: [
      {
        iconId: guildIconId,
        side: "center",
        scale: GOAL_INFLUENCE_ICON_SCALE,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
    ],
    decorations: [buildRingDecoration(sharedConfig.goalInfluenceShape)],
    ...sharedTokenFields(sharedConfig),
  };
};

// A single, identical, unnumbered token -- the selection's copies count is the physical
// quantity to print, not a range of distinct values (see [[batch-grid-and-tokens-2026-09-02]]
// in memory for why Influence/Momentum moved away from a numbered-per-value design).
const buildInfluenceTokenSpec = (sharedConfig: SharedConfig): TokenSpec => {
  return {
    version: 1,
    shape: sharedConfig.discShape,
    textLayout: "flat",
    lines: [],
    icons: [
      {
        iconId: sharedConfig.influenceIconId,
        side: "center",
        scale: DEFAULT_ICON_SCALE,
        colorGroup: TEXT_COLOR_GROUP_ID,
      },
    ],
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
  const items: TokenItem[] = [];

  for (const character of catalog.characters) {
    character.tokens.forEach((token, tokenIndex) => {
      const id = characterTokenId(character.id, tokenIndex);

      if (!selection.characterTokenIds.includes(id)) {
        return;
      }

      const copies =
        token.maxCopies && token.maxCopies > 1 ? (selection.characterTokenCopies[id] ?? 1) : 1;

      items.push({
        id,
        label: `${character.name}: ${token.title}`,
        spec: buildCharacterTokenSpec(token, guildIconId, sharedConfig),
        copies,
      });
    });
  }

  for (const generic of catalog.genericTokens) {
    const counter = selection.genericTokens[generic.id];

    if (!counter?.enabled) {
      continue;
    }

    items.push({
      id: generic.id,
      label: generic.name,
      spec: buildGenericTokenSpec(generic, guildIconId, sharedConfig),
      copies: counter.copies,
    });
  }

  if (selection.influence.enabled) {
    items.push({
      id: "influence",
      label: "Influence",
      spec: buildInfluenceTokenSpec(sharedConfig),
      copies: selection.influence.copies,
    });
  }

  if (selection.momentum.enabled) {
    items.push({
      id: "momentum",
      label: "Momentum",
      spec: buildMomentumTokenSpec(sharedConfig),
      copies: selection.momentum.copies,
    });
  }

  if (selection.goalInfluence.enabled) {
    items.push({
      id: "goal-influence",
      label: "Goal Influence",
      spec: buildGoalInfluenceTokenSpec(guildIconId, sharedConfig),
      copies: selection.goalInfluence.copies,
    });
  }

  return items;
};
