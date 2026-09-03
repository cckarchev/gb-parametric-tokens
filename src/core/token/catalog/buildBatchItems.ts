import { ColorGroupSpec, FitPolicy, ShapeSpec, StyleSpec, TokenSpec } from "../types";
import { CatalogGenericToken, CatalogTokenSpec, GuildCatalog } from "./catalogTypes";
import { TEXT_COLOR_GROUP_ID } from "./deriveReliefColor";

export type BatchItem = { id: string; label: string; spec: TokenSpec; copies: number };

export type BatchSelection = {
  characterTokenIds: string[];
  genericCopies: Record<string, number>;
  influenceCopies: number;
  momentumCopies: number;
  goalInfluenceCopies: number;
};

export type BatchSharedConfig = {
  arcShape: Extract<ShapeSpec, { type: "arc" }>;
  discShape: Extract<ShapeSpec, { type: "disc" }>;
  goalInfluenceShape: Extract<ShapeSpec, { type: "disc" }>;
  style: StyleSpec;
  fitPolicy: FitPolicy;
  printProfileId: string;
  colorGroups: ColorGroupSpec[];
  influenceIconId: string;
  titleSizeMm: number;
  subtitleSizeMm: number;
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

const GOAL_INFLUENCE_TEXT_RADIUS_RATIO = 0.55;
const GOAL_INFLUENCE_TEXT_SIZE_MM = 2.2;
const GOAL_INFLUENCE_ICON_SCALE = 0.35;
const GOAL_INFLUENCE_TOP_TEXT = "Goal";
const GOAL_INFLUENCE_BOTTOM_TEXT = "Influence";

export const characterTokenId = (characterId: string, tokenIndex: number): string => {
  return `${characterId}-${tokenIndex}`;
};

// Every token spec carries the same trailing style/printing fields from the batch's shared
// config, whatever its own shape, text, icons, and decorations look like.
const sharedTokenFields = (
  sharedConfig: BatchSharedConfig,
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
  sharedConfig: BatchSharedConfig,
): TokenSpec => {
  const iconId = token.iconId ?? guildIconId;
  const lines = token.line2
    ? [
        {
          text: token.line1,
          sizeMm: sharedConfig.titleSizeMm,
          colorGroup: TEXT_COLOR_GROUP_ID,
        },
        {
          text: token.line2,
          sizeMm: sharedConfig.subtitleSizeMm,
          colorGroup: TEXT_COLOR_GROUP_ID,
        },
      ]
    : [
        {
          text: token.line1,
          sizeMm: sharedConfig.titleSizeMm,
          colorGroup: TEXT_COLOR_GROUP_ID,
        },
      ];

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
  sharedConfig: BatchSharedConfig,
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
const buildRingDecoration = (discShape: Extract<ShapeSpec, { type: "disc" }>) => {
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
  sharedConfig: BatchSharedConfig,
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

// A single, identical, unnumbered token -- the batch selection's copies count is the physical
// quantity to print, not a range of distinct values (see [[batch-grid-and-tokens-2026-09-02]]
// in memory for why Influence/Momentum moved away from a numbered-per-value design).
const buildInfluenceTokenSpec = (sharedConfig: BatchSharedConfig): TokenSpec => {
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
const buildMomentumTokenSpec = (sharedConfig: BatchSharedConfig): TokenSpec => {
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

export const buildBatchItems = (
  catalog: GuildCatalog,
  selection: BatchSelection,
  sharedConfig: BatchSharedConfig,
): BatchItem[] => {
  const guildIconId = catalog.name;
  const items: BatchItem[] = [];

  for (const character of catalog.characters) {
    character.tokens.forEach((token, tokenIndex) => {
      const id = characterTokenId(character.id, tokenIndex);

      if (!selection.characterTokenIds.includes(id)) {
        return;
      }

      items.push({
        id,
        label: `${character.name}: ${token.line1}`,
        spec: buildCharacterTokenSpec(token, guildIconId, sharedConfig),
        copies: 1,
      });
    });
  }

  for (const generic of catalog.genericTokens) {
    const copies = selection.genericCopies[generic.id] ?? 0;

    if (copies <= 0) {
      continue;
    }

    items.push({
      id: generic.id,
      label: generic.name,
      spec: buildGenericTokenSpec(generic, guildIconId, sharedConfig),
      copies,
    });
  }

  if (selection.influenceCopies > 0) {
    items.push({
      id: "influence",
      label: "Influence",
      spec: buildInfluenceTokenSpec(sharedConfig),
      copies: selection.influenceCopies,
    });
  }

  if (selection.momentumCopies > 0) {
    items.push({
      id: "momentum",
      label: "Momentum",
      spec: buildMomentumTokenSpec(sharedConfig),
      copies: selection.momentumCopies,
    });
  }

  if (selection.goalInfluenceCopies > 0) {
    items.push({
      id: "goal-influence",
      label: "Goal Influence",
      spec: buildGoalInfluenceTokenSpec(guildIconId, sharedConfig),
      copies: selection.goalInfluenceCopies,
    });
  }

  return items;
};
