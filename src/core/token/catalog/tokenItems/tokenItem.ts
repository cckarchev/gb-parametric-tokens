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
  // "none" by default: applied to every guild icon this catalog builds (see buildIconSpec in
  // tokenSpecParts.ts) -- see IconOverflowBehavior in types.ts for what each value does.
  iconOverflowBehavior: IconOverflowBehavior;
};

export const characterTokenId = (characterId: string, tokenIndex: number): string => {
  return `${characterId}-${tokenIndex}`;
};
