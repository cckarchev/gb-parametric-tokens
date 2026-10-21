import type { Vec2 } from "../types";
import type { Bounds } from "./computeBounds";

export type PlateLayoutItem = {
  shapeType: "arc" | "disc";
  // The token's real extent around its own origin, which an arc's ribbon sits well away from.
  boundsMm: Bounds;
  copies: number;
};

// Each shape type and footprint size gets its own grid, so one big AOE doesn't widen every cell.
// Blocks stack from the plate origin toward -y, the way the preview reads top to bottom: arcs
// first, then discs, smallest first. Within a block, copies run left to right in rows.
const SHAPE_TYPE_ORDER: PlateLayoutItem["shapeType"][] = ["arc", "disc"];

type BlockEntry = { item: PlateLayoutItem; index: number };

const boundsWidthMm = (bounds: Bounds): number => bounds.max[0] - bounds.min[0];

const boundsHeightMm = (bounds: Bounds): number =>
  bounds.max[1] - bounds.min[1];

// Bounds are measured off the mesh, so two tokens of the same nominal size can differ by float
// noise; the key compares them at this many decimals.
const FOOTPRINT_KEY_DECIMALS = 1;

const footprintKey = (item: PlateLayoutItem): string => {
  const width = boundsWidthMm(item.boundsMm).toFixed(FOOTPRINT_KEY_DECIMALS);
  const height = boundsHeightMm(item.boundsMm).toFixed(FOOTPRINT_KEY_DECIMALS);

  return `${width}x${height}`;
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
    (first, second) =>
      boundsWidthMm(first[0].item.boundsMm) -
      boundsWidthMm(second[0].item.boundsMm),
  );
};

type BlockLayoutResult = { offsetsByItem: Vec2[][]; blockHeightMm: number };

// topY is the block's upper edge; its rows grow downward from there.
const layoutBlock = (
  blockItems: PlateLayoutItem[],
  spacingMm: number,
  topY: number,
): BlockLayoutResult => {
  if (blockItems.length === 0) {
    return { offsetsByItem: [], blockHeightMm: 0 };
  }

  const cellWidthMm =
    Math.max(...blockItems.map((item) => boundsWidthMm(item.boundsMm))) +
    spacingMm;
  const cellHeightMm =
    Math.max(...blockItems.map((item) => boundsHeightMm(item.boundsMm))) +
    spacingMm;
  const totalCopies = blockItems.reduce((sum, item) => sum + item.copies, 0);
  const columns = Math.max(1, Math.ceil(Math.sqrt(totalCopies)));

  const offsetsByItem: Vec2[][] = [];
  let flatIndex = 0;

  for (const item of blockItems) {
    const itemOffsets: Vec2[] = [];

    for (let copyIndex = 0; copyIndex < item.copies; copyIndex++) {
      const column = flatIndex % columns;
      const row = Math.floor(flatIndex / columns);
      const cellLeftX = column * cellWidthMm;
      const cellTopY = topY - row * cellHeightMm;

      // Moves the bounds' top-left corner onto the cell's top-left corner.
      const offsetX = cellLeftX - item.boundsMm.min[0];
      const offsetY = cellTopY - item.boundsMm.max[1];

      itemOffsets.push([offsetX, offsetY]);
      flatIndex++;
    }

    offsetsByItem.push(itemOffsets);
  }

  const rowCount = totalCopies === 0 ? 0 : Math.ceil(totalCopies / columns);
  const blockHeightMm = rowCount * cellHeightMm;

  return { offsetsByItem, blockHeightMm };
};

export const computePlateLayout = (
  items: PlateLayoutItem[],
  spacingMm: number,
): Vec2[][] => {
  const result: Vec2[][] = new Array(items.length);
  let topY = 0;

  const entries: BlockEntry[] = items.map((item, index) => ({ item, index }));

  for (const shapeType of SHAPE_TYPE_ORDER) {
    const shapeEntries = entries.filter(
      ({ item }) => item.shapeType === shapeType,
    );

    for (const blockEntries of groupBlocksBySize(shapeEntries)) {
      const { offsetsByItem, blockHeightMm } = layoutBlock(
        blockEntries.map(({ item }) => item),
        spacingMm,
        topY,
      );

      blockEntries.forEach(({ index }, blockPosition) => {
        result[index] = offsetsByItem[blockPosition];
      });

      topY -= blockHeightMm;
    }
  }

  // The blocks grew down from y = 0. Lift the whole plate so its lowest token sits on y = 0, the
  // front edge of a slicer bed: the last row ends in one spacing gap below its tallest token.
  const lowestTokenEdgeY = topY + spacingMm;
  const plateHasTokens = topY < 0;

  if (!plateHasTokens) {
    return result;
  }

  return result.map((offsets) =>
    offsets.map(
      ([offsetX, offsetY]): Vec2 => [offsetX, offsetY - lowestTokenEdgeY],
    ),
  );
};
