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
  characters: CatalogCharacter[];
  genericTokens: CatalogGenericToken[];
};
