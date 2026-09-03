export type CatalogTokenSpec = {
  line1: string;
  line2?: string;
  iconId?: string;
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
