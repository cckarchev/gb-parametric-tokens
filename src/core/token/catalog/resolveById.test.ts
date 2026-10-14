import { describe, expect, it } from "vitest";

import { buildLookup, resolveById } from "./resolveById";

type Item = { id: string; label: string };

const byId = (item: Item): string => item.id;

describe("resolveById", () => {
  it("finds an item previously indexed by buildLookup", () => {
    const lookup = buildLookup<Item>(
      [
        { id: "a", label: "Alpha" },
        { id: "b", label: "Beta" },
      ],
      byId,
    );

    expect(resolveById(lookup, "b", "item")).toEqual({ id: "b", label: "Beta" });
  });

  it("throws a message naming the missing id and the kind of item", () => {
    const lookup = buildLookup<Item>([{ id: "a", label: "Alpha" }], byId);

    expect(() => resolveById(lookup, "missing", "item")).toThrow('Unknown item "missing"');
  });
});
