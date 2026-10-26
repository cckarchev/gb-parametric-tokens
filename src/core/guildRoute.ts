import { GENERIC_CATALOG_ID } from "./token/catalog/genericCatalog";

const GUILD_ROUTE_SEGMENT = "guild";

// The generic catalog is not a guild, so it lives at its own top-level path
// rather than under "/guild/", while still flowing through the same selected-id
// plumbing as any guild.
const GENERIC_PATHNAME = `/${GENERIC_CATALOG_ID}`;

export const guildPathname = (guildId: string): string => {
  if (guildId === GENERIC_CATALOG_ID) {
    return GENERIC_PATHNAME;
  }

  const encodedGuildId = encodeURIComponent(guildId);

  return `/${GUILD_ROUTE_SEGMENT}/${encodedGuildId}`;
};

const decodeGuildId = (encodedGuildId: string): string | undefined => {
  try {
    return decodeURIComponent(encodedGuildId);
  } catch {
    // A malformed escape (e.g. a lone "%E0") is just a URL that names no guild,
    // not a crash.
    return undefined;
  }
};

// Only an exact "/guild/<id>" or "/generic" (an optional trailing slash aside)
// is a route. Anything else, including a deeper path under either, is not, so
// the caller can fall back to the guild picker. "/guild/generic" is not a route
// either: the generic catalog has one URL.
export const guildIdFromPathname = (pathname: string): string | undefined => {
  const segments = pathname.split("/").filter((segment) => segment.length > 0);
  const [routeSegment, encodedGuildId] = segments;
  const isGenericRoute =
    segments.length === 1 && routeSegment === GENERIC_CATALOG_ID;

  if (isGenericRoute) {
    return GENERIC_CATALOG_ID;
  }

  const isGuildRoute =
    segments.length === 2 && routeSegment === GUILD_ROUTE_SEGMENT;

  if (!isGuildRoute) {
    return undefined;
  }

  const guildId = decodeGuildId(encodedGuildId);

  if (guildId === GENERIC_CATALOG_ID) {
    return undefined;
  }

  return guildId;
};
