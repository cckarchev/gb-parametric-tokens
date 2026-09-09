export type CatalogTokenSpec = {
  title: string;
  subtitle?: string;
  iconId?: string;
  // Max simultaneous copies of this token in play. Omitted means 1, only set when higher.
  maxCopies?: number;
};

export type CatalogCharacter = {
  id: string;
  name: string;
  tokens: CatalogTokenSpec[];
};

export type CatalogGenericToken = {
  id: string;
  name: string;
  iconId?: string;
};

export type GuildCatalog = {
  guildId: string;
  name: string;
  color: string;
  // Multiplies the guild's own crest icon's scale wherever it's printed on a physical token
  // (character tokens, generic tokens, Goal Influence), so the nob art matches the same guild
  // crest sizing already applied to its badge in the guild picker (see GuildSelector.tsx's
  // iconScale). Never applied to a token's own custom iconId, only to the shared guild crest.
  // Optional; defaults to 1 (no change) when omitted.
  iconScale?: number;
  characters: CatalogCharacter[];
  genericTokens: CatalogGenericToken[];
};
