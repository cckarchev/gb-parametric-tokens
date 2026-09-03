import { useCallback, useEffect, useState } from "react";

import { AvailableGuild, listAvailableGuilds } from "../browser/listAvailableGuilds";
import { loadGuildCatalog } from "../browser/loadGuildCatalog";
import { GuildCatalog } from "../core/token/catalog/catalogTypes";

// TEMPORARY: auto-selects Brewers so the batch flow has something loaded on open. Remove once
// there's a real guild picker / persisted last-selected-guild, once more than one guild exists.
const TEMPORARY_DEFAULT_GUILD_ID = "brewers";

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

        const hasTemporaryDefaultGuild = loadedGuilds.some(
          (guild) => guild.id === TEMPORARY_DEFAULT_GUILD_ID,
        );

        if (hasTemporaryDefaultGuild) {
          selectGuild(TEMPORARY_DEFAULT_GUILD_ID);
        }
      })
      .catch((error: unknown) => {
        setCatalogError(error instanceof Error ? error.message : String(error));
      });
    // selectGuild is stable across renders (useCallback with an empty dependency array), so
    // this effect only needs to run once, on mount.
  }, []);

  return { guilds, selectedGuildId, selectGuild, catalog, catalogStatus, catalogError };
};
