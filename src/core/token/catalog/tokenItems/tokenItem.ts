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

// The tuning groups below hold what used to be module constants in each catalog builder, so the
// Advanced settings panel can edit them. Scales are fractions (0.55 shows as 55 %), lengths are mm.
export type DiscTokenTuning = {
  // Generics and Influence; Momentum has no crest.
  crestScale: number;
};

export type CharacterTokenTuning = {
  crestScale: number;
  // Applied only with balanceTwoLineSizes on and a second line shown.
  balanceNameScale: number;
  balanceEffectScale: number;
};

// Goal Influence and every effect with layout "ring" (see ringTokenSpec.ts).
export type RingBadgeTuning = {
  textSizeMm: number;
  // From the rim to the outer edge of the text's ink (see ringTextRadii.ts).
  textInsetMm: number;
  crestScale: number;
};

export type MomentumTuning = {
  textSizeMm: number;
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
  // "none" by default: applied to every guild icon this catalog builds (see buildIconSpec in
  // tokenSpecParts.ts) -- see IconOverflowBehavior in types.ts for what each value does.
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
