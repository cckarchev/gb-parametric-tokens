import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type AvailableGuild,
  listAvailableGuilds,
} from "@/browser/listAvailableGuilds";
import { loadGuildCatalog } from "@/browser/loadGuildCatalog";
import { describeError } from "@/core/describeError";
import { guildIdFromPathname, guildPathname } from "@/core/guildRoute";
import type { GuildCatalog } from "@/core/token/catalog/catalogTypes";

// No "loading": every guild's catalog is inlined in the bundle, so selecting one either resolves
// on the spot or throws on the spot: there is no in-between state to render.
type CatalogStatus = "idle" | "ready" | "error";

type CatalogState = {
  catalog?: GuildCatalog;
  catalogStatus: CatalogStatus;
  catalogError?: string;
};

const ROOT_PATHNAME = "/";

const NO_CATALOG_STATE: CatalogState = { catalogStatus: "idle" };

// Looked up on every render instead of kept in state. The lookup returns the same object, so
// identity holds, and a hot-reloaded JSON edit shows up at once.
const catalogStateFor = (guildId: string | undefined): CatalogState => {
  if (guildId === undefined) {
    return NO_CATALOG_STATE;
  }

  try {
    const catalog = loadGuildCatalog(guildId);

    return { catalog, catalogStatus: "ready" };
  } catch (error) {
    return { catalogStatus: "error", catalogError: describeError(error) };
  }
};

// The URL is the source of truth for which guild is open: "/guild/<id>" for a known guild,
// anything else means no guild. An unknown guild or path is rewritten to the root in place
// (replaceState, not pushState) so the back button never lands on it again.
const guildIdFromLocation = (guilds: AvailableGuild[]): string | undefined => {
  const routeGuildId = guildIdFromPathname(window.location.pathname);
  const isKnownGuild = guilds.some((guild) => guild.id === routeGuildId);

  if (routeGuildId !== undefined && isKnownGuild) {
    return routeGuildId;
  }

  if (window.location.pathname !== ROOT_PATHNAME) {
    window.history.replaceState(null, "", ROOT_PATHNAME);
  }

  return undefined;
};

export const useGuildCatalog = () => {
  // Built once: the underlying list is a module-level constant, but rebuilding the mapped array
  // on every render would hand consumers a new array identity each time for no reason.
  const guilds = useMemo(() => listAvailableGuilds(), []);

  // Lazy initializer, so a deep link to /guild/<id> renders that guild on the very first paint
  // instead of flashing the empty picker first.
  const [selectedGuildId, setSelectedGuildId] = useState<string | undefined>(
    () => guildIdFromLocation(guilds),
  );

  // Back/forward only changes the URL; this brings the open guild back in line with it.
  useEffect(() => {
    const syncWithLocation = () => {
      setSelectedGuildId(guildIdFromLocation(guilds));
    };

    window.addEventListener("popstate", syncWithLocation);

    return () => {
      window.removeEventListener("popstate", syncWithLocation);
    };
  }, [guilds]);

  const selectGuild = useCallback((guildId: string) => {
    const nextPathname = guildPathname(guildId);

    if (window.location.pathname !== nextPathname) {
      window.history.pushState(null, "", nextPathname);
    }

    setSelectedGuildId(guildId);
  }, []);

  const { catalog, catalogStatus, catalogError } =
    catalogStateFor(selectedGuildId);

  return {
    guilds,
    selectedGuildId,
    selectGuild,
    catalog,
    catalogStatus,
    catalogError,
  };
};
