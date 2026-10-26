// Characters and generic tokens are still keyed by their own `name`, which is
// unique across the catalog (see characters.json's vX/sX veteran/seasoned
// naming). Effects are not: one ability can offer several outcomes, each its
// own token sharing the ability's printed name, so effects carry a separate
// camelCase `id` and are referenced by that instead.
export type CatalogEffect = {
  id: string;
  name: string;
  effect?: string;
  // Set when one model's token isn't enough: a play that isn't once per turn, a
  // bonus that stacks, or a pulse that lands on several models. Such a token
  // gets a copies count; anything else (once-per-turn plays, "Used" markers,
  // auras, most traits) always prints once.
  repeatable?: true;
  // "ring" prints a round token shaped like Goal Influence (crest centered,
  // name curved on top, effect text curved below) instead of the usual arc, for
  // an effect that tracks a pool of something rather than a status on a model.
  // Omitted means the arc.
  layout?: "ring";
};

// A fixed-size 3″ AOE template (see catalog/token-items/aoeTemplateSpec.ts),
// not a reminder token: its own catalog, referenced from a character by id just
// like effects.
export type CatalogAoeTemplate = {
  id: string;
  name: string;
  effect: string;
  // Max simultaneous copies in play (Broadside positions two). Omitted means 1.
  maxCopies?: number;
};

// A game condition marker (Poison, Burning...) printed with its own icon, not
// the guild crest: its own catalog, shared by every guild unless `guilds`
// restricts it to the listed guild ids (Disease only exists for Ratcatchers).
export type CatalogCondition = {
  id: string;
  name: string;
  iconId: string;
  // Multiplies the shared condition icon scale for an icon whose shape leaves
  // room to grow (or needs to shrink) on the disc. Optional; defaults to 1.
  iconScale?: number;
  guilds?: string[];
};

// A Game Plan card whose effect stays on the table for the turn (a model buffed
// or marked, a terrain piece stripped of cover), printed as an arc token just
// like a character effect. Only the generic catalog offers them: the deck is
// shared by every guild (see gamePlans.json).
export type CatalogGamePlan = {
  id: string;
  name: string;
  effect: string;
  // Max simultaneous copies in play (Extra Shot buffs two models). Omitted
  // means 1.
  maxCopies?: number;
};

export type CatalogCharacter = {
  name: string;
  // The ids of this character's own tokens, each one a reference into
  // effects.json, see resolveEffect.
  effects: string[];
  // The ids of this character's AOE templates, each one a reference into
  // aoeTemplates.json, see resolveAoeTemplate. Omitted for the many characters
  // that have none.
  aoeTemplates?: string[];
};

export type CatalogGenericToken = {
  name: string;
  iconId?: string;
  // Max simultaneous copies of this token in play. Omitted means the UI's own
  // default cap (see GuildTokenList's MAX_COPIES), only set when the rules
  // impose a lower one.
  maxCopies?: number;
};

export type GuildCatalog = {
  // The guild file's name (see guildCatalogs.ts).
  guildId: string;
  name: string;
  color: string;
  // Scales this guild's crest, for one that reads small or large next to the
  // others. Applies to the guild picker's tile and to every printed token that
  // wears the crest. Defaults to 1.
  iconScale?: number;
  characters: CatalogCharacter[];
  genericTokens: CatalogGenericToken[];
  // Resolved from conditions.json at load time (see guildCatalogs.ts): every
  // shared condition plus any restricted to this guild.
  conditions: CatalogCondition[];
  // The ids of the conditions this guild's roster can actually inflict (the
  // guild file's own `conditions` field), preselected in its default selection.
  // The rest of `conditions` is still offered, just unchecked.
  appliedConditionIds: string[];
  // Empty for every guild: only the generic catalog carries the shared Game
  // Plan deck.
  gamePlans: CatalogGamePlan[];
};
