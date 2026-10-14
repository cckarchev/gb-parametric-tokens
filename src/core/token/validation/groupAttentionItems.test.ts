import { describe, expect, it } from "vitest";

import { groupAttentionItems } from "./groupAttentionItems";

const sugarA = { id: "sugar-a", group: "Sugar", name: "Sweet Tooth" };
const sugarB = { id: "sugar-b", group: "Sugar", name: "Sugar Rush" };
const influence = { id: "influence", name: "Influence" };

describe("groupAttentionItems", () => {
  it("puts a character's items under one group headed by the character", () => {
    const groups = groupAttentionItems([sugarA, sugarB]);

    expect(groups).toEqual([{ key: "Sugar", heading: "Sugar", items: [sugarA, sugarB] }]);
  });

  it("gives an item without a group its own group, headed by its own name", () => {
    const groups = groupAttentionItems([influence]);

    expect(groups).toEqual([{ key: "influence", heading: "Influence", items: [influence] }]);
  });

  it("keeps the order each group first appears in", () => {
    const groups = groupAttentionItems([sugarA, influence, sugarB]);

    expect(groups.map((group) => group.key)).toEqual(["Sugar", "influence"]);
    expect(groups[0].items).toEqual([sugarA, sugarB]);
  });
});
