import { Vec2 } from "../types";

export type BatchLayoutItem = {
  shapeType: "arc" | "disc";
  footprintMm: { width: number; height: number };
  copies: number;
};

// Arc tokens (wide ribbons) and disc tokens (small squares) have very different footprints,
// so mixing them into one uniform grid wastes space or overlaps. Each block gets its own grid
// sized to its own items, stacked vertically: arc block first, disc block below it.
const SHAPE_TYPE_ORDER: BatchLayoutItem["shapeType"][] = ["arc", "disc"];

type BlockLayoutResult = { offsetsByItem: Vec2[][]; blockHeightMm: number };

const layoutBlock = (
  blockItems: BatchLayoutItem[],
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

export const computeBatchPlateLayout = (items: BatchLayoutItem[], spacingMm: number): Vec2[][] => {
  const result: Vec2[][] = new Array(items.length);
  let originY = 0;

  for (const shapeType of SHAPE_TYPE_ORDER) {
    const blockEntries = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.shapeType === shapeType);

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

  return result;
};
