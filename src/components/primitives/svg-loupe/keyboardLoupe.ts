import type { PointPx } from "./computeLoupeTransform";

// Keyboard control of the loupe: arrows move the lens, +/- zoom it.

// How far one arrow press moves the lens across the preview.
export const KEYBOARD_STEP_PX = 10;
// How much one +/- press changes the zoom; about two mouse-wheel notches.
export const KEYBOARD_ZOOM_STEP = 0.5;

type AreaSize = { width: number; height: number };

// Maps, because the keys are KeyboardEvent.key names, not our own.
const ARROW_DIRECTIONS = new Map<string, PointPx>([
  ["ArrowLeft", { x: -1, y: 0 }],
  ["ArrowRight", { x: 1, y: 0 }],
  ["ArrowUp", { x: 0, y: -1 }],
  ["ArrowDown", { x: 0, y: 1 }],
]);

const ZOOM_DIRECTIONS = new Map<string, number>([
  ["+", 1],
  // The unshifted + key, so zooming in doesn't need Shift.
  ["=", 1],
  ["-", -1],
]);

const clamp = (value: number, max: number): number =>
  Math.min(max, Math.max(0, value));

export const areaCenter = (area: AreaSize): PointPx => ({
  x: area.width / 2,
  y: area.height / 2,
});

// The cursor one step along the pressed arrow, kept inside the area, or
// undefined for any other key.
export const nudgeCursor = (
  cursor: PointPx,
  key: string,
  area: AreaSize,
): PointPx | undefined => {
  const direction = ARROW_DIRECTIONS.get(key);

  if (!direction) {
    return undefined;
  }

  const nextX = cursor.x + direction.x * KEYBOARD_STEP_PX;
  const nextY = cursor.y + direction.y * KEYBOARD_STEP_PX;

  return { x: clamp(nextX, area.width), y: clamp(nextY, area.height) };
};

export const zoomDeltaForKey = (key: string): number | undefined => {
  const direction = ZOOM_DIRECTIONS.get(key);

  if (direction === undefined) {
    return undefined;
  }

  return direction * KEYBOARD_ZOOM_STEP;
};
