// Characters and generic tokens are still keyed by their own `name`, which is unique across the
// catalog (see characters.json's vX/sX veteran/seasoned naming). Effects are not: one ability
// can offer several outcomes, each its own token sharing the ability's printed name, so effects
// carry a separate camelCase `id` and are referenced by that instead.
export type CatalogEffect = {
  id: string;
  name: string;
  effect?: string;
  // Max simultaneous copies of this effect's token in play. Omitted means 1, only set when higher.
  maxCopies?: number;
};

export type CatalogCharacter = {
  name: string;
  // The ids of this character's own tokens, each one a reference into effects.json, see
  // resolveEffect.
  effects: string[];
};

export type CatalogGenericToken = {
  name: string;
  iconId?: string;
  // Max simultaneous copies of this token in play. Omitted means the UI's own default cap (see
  // GuildTokenList's MAX_COPIES), only set when the rules impose a lower one.
  maxCopies?: number;
};

export type GuildCatalog = {
  // Derived from the guild's own JSON file name at load time (see guildCatalogs.ts), not stored
  // in the file itself -- the file name was already the source of truth, so keeping a second copy
  // inside the file could only ever drift out of sync with it.
  guildId: string;
  name: string;
  color: string;
  // Multiplies the guild's own crest icon's scale wherever it's printed on a physical token
  // (character tokens, generic tokens, Goal Influence), so the stud art matches the same guild
  // crest sizing already applied to its badge in the guild picker (see GuildSelector.tsx's
  // iconScale). Never applied to a token's own custom iconId, only to the shared guild crest.
  // Optional; defaults to 1 (no change) when omitted.
  iconScale?: number;
  characters: CatalogCharacter[];
  genericTokens: CatalogGenericToken[];
};
