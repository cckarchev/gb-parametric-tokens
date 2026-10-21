// What grouping needs from an item in the "needs attention" list.
type AttentionItem = { id: string; group?: string; name: string };

export type AttentionGroup<Item extends AttentionItem> = {
  key: string;
  heading: string;
  items: Item[];
};

// A character's tokens share one heading instead of repeating the character's name on every
// line (see TokenItem's `group`); anything without a group (guild generics, Influence,
// Momentum, Goal Influence) is its own single-item group, headed by its own name.
export const groupAttentionItems = <Item extends AttentionItem>(
  items: Item[],
): AttentionGroup<Item>[] => {
  const groupsByKey = new Map<string, AttentionGroup<Item>>();

  for (const item of items) {
    const key = item.group ?? item.id;
    const existingGroup = groupsByKey.get(key);

    if (existingGroup) {
      existingGroup.items.push(item);
      continue;
    }

    groupsByKey.set(key, {
      key,
      heading: item.group ?? item.name,
      items: [item],
    });
  }

  return [...groupsByKey.values()];
};
