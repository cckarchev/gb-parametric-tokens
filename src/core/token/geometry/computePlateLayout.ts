import { Vec2 } from "../types";

export type PlateLayoutItem = {
  shapeType: "arc" | "disc";
  footprintMm: { width: number; height: number };
  copies: number;
};

// Arc tokens (wide ribbons) and disc tokens (small squares) have very different footprints,
// so mixing them into one uniform grid wastes space or overlaps. The same holds between discs of
// different sizes: one 76.2mm AOE template in a block of 15mm counters would widen every cell to
// its own size. So each shape type and footprint size gets its own block, a grid sized to its own
// items, stacked vertically: arc blocks first, then disc blocks, smallest footprint first.
const SHAPE_TYPE_ORDER: PlateLayoutItem["shapeType"][] = ["arc", "disc"];

type BlockEntry = { item: PlateLayoutItem; index: number };

const footprintKey = (item: PlateLayoutItem): string => {
  return `${item.footprintMm.width}x${item.footprintMm.height}`;
};

// One block per distinct footprint within a shape type, ordered by footprint width so the
// stacking is predictable whatever order the items arrive in.
const groupBlocksBySize = (shapeEntries: BlockEntry[]): BlockEntry[][] => {
  const blocksByKey = new Map<string, BlockEntry[]>();

  for (const entry of shapeEntries) {
    const key = footprintKey(entry.item);
    const block = blocksByKey.get(key) ?? [];

    block.push(entry);
    blocksByKey.set(key, block);
  }

  const blocks = [...blocksByKey.values()];

  return blocks.sort(
    (first, second) => first[0].item.footprintMm.width - second[0].item.footprintMm.width,
  );
};

type BlockLayoutResult = { offsetsByItem: Vec2[][]; blockHeightMm: number };

const layoutBlock = (
  blockItems: PlateLayoutItem[],
  spacingMm: number,
  originY: number,
): BlockLayoutResult => {
  if (blockItems.length === 0) {
    return { offsetsByItem: [], blockHeightMm: 0 };
  }

  const cellWidthMm = Math.max(...blockItems.map((item) => item.footprintMm.width)) + spacingMm;
  const cellHeightMm = Math.max(...blockItems.map((item) => item.footprintMm.height)) + spacingMm;
  const totalCopies = blockItems.reduce((sum, item) => sum + item.copies, 0);
  const columns = Math.max(1, Math.ceil(Math.sqrt(totalCopies)));

  const offsetsByItem: Vec2[][] = [];
  let flatIndex = 0;

  for (const item of blockItems) {
    const itemOffsets: Vec2[] = [];

    for (let copyIndex = 0; copyIndex < item.copies; copyIndex++) {
      const column = flatIndex % columns;
      const row = Math.floor(flatIndex / columns);

      itemOffsets.push([column * cellWidthMm, originY + row * cellHeightMm]);
      flatIndex++;
    }

    offsetsByItem.push(itemOffsets);
  }

  const rowCount = totalCopies === 0 ? 0 : Math.ceil(totalCopies / columns);
  const blockHeightMm = rowCount * cellHeightMm;

  return { offsetsByItem, blockHeightMm };
};

export const computePlateLayout = (items: PlateLayoutItem[], spacingMm: number): Vec2[][] => {
  const result: Vec2[][] = new Array(items.length);
  let originY = 0;

  const entries: BlockEntry[] = items.map((item, index) => ({ item, index }));

  for (const shapeType of SHAPE_TYPE_ORDER) {
    const shapeEntries = entries.filter(({ item }) => item.shapeType === shapeType);

    for (const blockEntries of groupBlocksBySize(shapeEntries)) {
      const { offsetsByItem, blockHeightMm } = layoutBlock(
        blockEntries.map(({ item }) => item),
        spacingMm,
        originY,
      );

      blockEntries.forEach(({ index }, blockPosition) => {
        result[index] = offsetsByItem[blockPosition];
      });

      originY += blockHeightMm;
    }
  }

  return result;
};
