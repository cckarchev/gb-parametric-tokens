// characters.json names a veteran or seasoned version with a lowercase "v" or
// "s" prefix on the regular name ("vSpigot", "sBrisket"). A capitalized name
// starting with V or S is a regular one.
const VERSION_PREFIX_PATTERN = /^[vs](?=[A-Z])/;

const regularNameOf = (name: string): string =>
  name.replace(VERSION_PREFIX_PATTERN, "");

const isAlternateVersion = (name: string): boolean =>
  VERSION_PREFIX_PATTERN.test(name);

// Alphabetical by the regular name, so a veteran sits right after the model it
// is a version of (or where that model would be, when the guild doesn't field
// it).
export const sortRosterNames = (names: string[]): string[] =>
  [...names].sort((left, right) => {
    const regularNameOrder = regularNameOf(left).localeCompare(
      regularNameOf(right),
    );

    if (regularNameOrder !== 0) {
      return regularNameOrder;
    }

    return Number(isAlternateVersion(left)) - Number(isAlternateVersion(right));
  });
