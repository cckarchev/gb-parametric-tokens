import { useCallback, useMemo, useState } from "react";

import { listAvailableGuilds } from "../browser/listAvailableGuilds";
import { loadGuildCatalog } from "../browser/loadGuildCatalog";
import { describeError } from "../core/describeError";
import { GuildCatalog } from "../core/token/catalog/catalogTypes";

// No "loading": every guild's catalog is inlined in the bundle, so selecting one either resolves
// on the spot or throws on the spot -- there is no in-between state to render.
type CatalogStatus = "idle" | "ready" | "error";

export const useGuildCatalog = () => {
  // Built once: the underlying list is a module-level constant, but rebuilding the mapped array
  // on every render would hand consumers a new array identity each time for no reason.
  const guilds = useMemo(() => listAvailableGuilds(), []);

  const [selectedGuildId, setSelectedGuildId] = useState<string>();
  const [catalog, setCatalog] = useState<GuildCatalog>();
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("idle");
  const [catalogError, setCatalogError] = useState<string>();

  const selectGuild = useCallback((guildId: string) => {
    setSelectedGuildId(guildId);
    setCatalogError(undefined);

    try {
      setCatalog(loadGuildCatalog(guildId));
      setCatalogStatus("ready");
    } catch (error) {
      setCatalogStatus("error");
      setCatalogError(describeError(error));
    }
  }, []);

  return { guilds, selectedGuildId, selectGuild, catalog, catalogStatus, catalogError };
};
