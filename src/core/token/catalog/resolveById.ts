export const buildLookup = <T>(
  items: T[],
  keyFn: (item: T) => string,
): Map<string, T> => new Map(items.map((item) => [keyFn(item), item]));

export const resolveById = <T>(
  lookup: Map<string, T>,
  key: string,
  kind: string,
): T => {
  const item = lookup.get(key);

  if (!item) {
    throw new Error(`Unknown ${kind} "${key}"`);
  }

  return item;
};
