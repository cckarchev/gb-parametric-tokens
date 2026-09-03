import { useCallback, useEffect, useState } from "react";

import { AvailableGuild, listAvailableGuilds } from "../browser/listAvailableGuilds";
import { loadGuildCatalog } from "../browser/loadGuildCatalog";
import { GuildCatalog } from "../core/token/catalog/catalogTypes";

export type CatalogStatus = "idle" | "loading" | "ready" | "error";

export const useGuildCatalog = () => {
  const [guilds, setGuilds] = useState<AvailableGuild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>();
  const [catalog, setCatalog] = useState<GuildCatalog>();
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("idle");
  const [catalogError, setCatalogError] = useState<string>();

  const selectGuild = useCallback((guildId: string) => {
    setSelectedGuildId(guildId);
    setCatalogStatus("loading");
    setCatalogError(undefined);

    loadGuildCatalog(guildId)
      .then((loadedCatalog) => {
        setCatalog(loadedCatalog);
        setCatalogStatus("ready");
      })
      .catch((error: unknown) => {
        setCatalogStatus("error");
        setCatalogError(error instanceof Error ? error.message : String(error));
      });
  }, []);

  useEffect(() => {
    listAvailableGuilds()
      .then((loadedGuilds) => {
        setGuilds(loadedGuilds);
      })
      .catch((error: unknown) => {
        setCatalogError(error instanceof Error ? error.message : String(error));
      });
  }, []);

  return { guilds, selectedGuildId, selectGuild, catalog, catalogStatus, catalogError };
};
