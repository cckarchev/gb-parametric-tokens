// An untouched repeatable token starts at two copies: most plays land on a model or two, and
// whoever prints a set raises the count for the ones their list really leans on.
export const DEFAULT_TOKEN_COPIES = 2;

// How many copies a selected character token or AOE template prints: the count the user picked,
// or the default while they haven't, never past the token's own cap.
export const resolveTokenCopies = (
  storedCopies: number | undefined,
  maxCopies: number,
): number => {
  const requestedCopies = storedCopies ?? DEFAULT_TOKEN_COPIES;

  return Math.min(requestedCopies, maxCopies);
};
