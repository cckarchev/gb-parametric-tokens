import {
  ArcShapeSpec,
  ColorGroupSpec,
  DiscShapeSpec,
  FitPolicy,
  IconOverflowBehavior,
  StyleSpec,
  TokenSpec,
} from "../../types";

export type TokenItem = {
  id: string;
  label: string;
  // The character a token belongs to, undefined for anything that isn't a character token
  // (guild generics, Influence, Momentum, Goal Influence). It lets the "needs attention" list
  // group a character's tokens together instead of repeating their name on every line.
  group?: string;
  name: string;
  spec: TokenSpec;
  copies: number;
};

// Whether a guild-level counter (Influence, Momentum, Goal Influence, a generic token) is
// printed, and how many copies. `copies` survives unchecking, so checking it again restores the
// last count, as character tokens already do.
export type CounterSelection = { enabled: boolean; copies: number };

// The floor for any copies count the user can edit, whether it belongs to a counter or to a
// character token: a selected token always prints at least once, and dropping to zero is
// expressed by unchecking it rather than by counting down to nothing.
export const MIN_COPIES = 1;

// A counter the user hasn't opted into yet: unchecked, at the minimum count.
export const DISABLED_COUNTER: CounterSelection = { enabled: false, copies: MIN_COPIES };

// The cap for a repeatable character token (see CatalogEffect.repeatable): rather than deriving a
// per-play limit from cost and influence, whoever prints a set picks what their list really needs.
export const CHARACTER_TOKEN_MAX_COPIES = 6;

export type TokenSelection = {
  // Holds a character's AOE template ids too (see characterAoeTemplateId below).
  characterTokenIds: string[];
  // Copies for a selected character token or AOE template, see resolveTokenCopies for the
  // default while unset. Left untouched when a token is deselected, so re-selecting it restores
  // the count instead of resetting it.
  characterTokenCopies: Record<string, number>;
  genericTokens: Record<string, CounterSelection>;
  influence: CounterSelection;
  momentum: CounterSelection;
  goalInfluence: CounterSelection;
  // Keyed by condition id (see conditions.json), like genericTokens is keyed by name.
  conditions: Record<string, CounterSelection>;
  // Keyed by game plan id (see gamePlans.json).
  gamePlans: Record<string, CounterSelection>;
};

// "ring" is the full 3″ hollow template. "compactDisc" is a 1″ marker set at the AOE's center:
// the area's edge is then a whole inch from the marker's own edge, easy to measure, and the small
// disc fits between models where the full ring doesn't. "crowfoot" keeps three short arcs of the
// 3″ edge on spokes from the center: the edge itself is marked, with far less plastic to place.
export type AoeTemplateVariant = "ring" | "compactDisc" | "crowfoot";

// Tuning the Advanced settings panel edits. Scales are fractions (0.55 shows as 55 %), lengths
// are mm.
export type DiscTokenTuning = {
  // Generics and Influence; Momentum has no crest.
  crestScale: number;
};

export type CharacterTokenTuning = {
  crestScale: number;
  // Applied only with balanceTwoLineSizes on and a second line shown.
  balanceNameScale: number;
  balanceEffectScale: number;
  // The name's size when it is the token's only line: with nothing to share the band with, it
  // can be larger than the two-line nameSizeMm.
  singleLineNameSizeMm: number;
  // A FONT_CATALOG id, as are the other tunings' fontId.
  fontId: string;
};

// Goal Influence and every effect with layout "ring" (see ringTokenSpec.ts).
export type RingBadgeTuning = {
  textSizeMm: number;
  // From the rim to the outer edge of the text's ink (see ringTextRadii.ts).
  textInsetMm: number;
  crestScale: number;
  fontId: string;
};

export type MomentumTuning = {
  textSizeMm: number;
  fontId: string;
  // From the rim to the ring decoration's outer edge.
  ringInsetMm: number;
  ringWidthMm: number;
};

export type ConditionTuning = {
  iconScale: number;
};

export type CrowfootTuning = {
  spokeCount: number;
  spokeWidthMm: number;
  arcSweepDeg: number;
  cornerRadiusMm: number;
  filletEnabled: boolean;
  filletRadiusMm: number;
  textSizeMm: number;
  // The stretch of each spoke the effect text may use: this far from the center, and this far
  // short of the arc.
  spokeTextCenterClearanceMm: number;
  spokeTextBandMarginMm: number;
};

export type AoeTuning = {
  // Shared by the full ring and the crow's foot's arcs.
  bandWidthMm: number;
  // Shared by all three variants.
  fontId: string;
  ring: { textSizeMm: number };
  compactDisc: { textSizeMm: number; textInsetMm: number; crestScale: number };
  crowfoot: CrowfootTuning;
};

export type TokenTuning = {
  discToken: DiscTokenTuning;
  characterToken: CharacterTokenTuning;
  ringBadge: RingBadgeTuning;
  momentum: MomentumTuning;
  condition: ConditionTuning;
  aoe: AoeTuning;
};

export type SharedConfig = TokenTuning & {
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
  // Applied to every guild icon (see IconOverflowBehavior in types.ts).
  iconOverflowBehavior: IconOverflowBehavior;
  aoeTemplateVariant: AoeTemplateVariant;
};

export const characterTokenId = (characterId: string, tokenIndex: number): string => {
  return `${characterId}-${tokenIndex}`;
};

// Its own "-aoe-" segment so a template's id can never collide with a token's, while still
// living in the same selection arrays (characterTokenIds/characterTokenCopies) so the stored and
// exported selection keeps its shape.
export const characterAoeTemplateId = (characterId: string, templateIndex: number): string => {
  return `${characterId}-aoe-${templateIndex}`;
};

// Prefixed so a condition can never collide with a guild generic token, whose item id is its
// bare name.
export const conditionTokenId = (conditionId: string): string => {
  return `condition-${conditionId}`;
};

// Prefixed for the same reason as conditionTokenId.
export const gamePlanTokenId = (gamePlanId: string): string => {
  return `game-plan-${gamePlanId}`;
};
