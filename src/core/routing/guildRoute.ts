const GUILD_ROUTE_SEGMENT = "guild";

export const guildPathname = (guildId: string): string => {
  const encodedGuildId = encodeURIComponent(guildId);

  return `/${GUILD_ROUTE_SEGMENT}/${encodedGuildId}`;
};

// Only an exact "/guild/<id>" (an optional trailing slash aside) is a guild route. Anything else,
// including a deeper path under it, is not, so the caller can fall back to the guild picker.
export const guildIdFromPathname = (pathname: string): string | undefined => {
  const segments = pathname.split("/").filter((segment) => segment.length > 0);
  const [routeSegment, encodedGuildId] = segments;
  const isGuildRoute = segments.length === 2 && routeSegment === GUILD_ROUTE_SEGMENT;

  if (!isGuildRoute) {
    return undefined;
  }

  try {
    return decodeURIComponent(encodedGuildId);
  } catch {
    // A malformed escape (e.g. a lone "%E0") is just a URL that names no guild, not a crash.
    return undefined;
  }
};
