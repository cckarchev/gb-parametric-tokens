import { describe, expect, it } from "vitest";

import {
  areaCenter,
  KEYBOARD_STEP_PX,
  KEYBOARD_ZOOM_STEP,
  nudgeCursor,
  zoomDeltaForKey,
} from "./keyboardLoupe";

const area = { width: 200, height: 100 };
const middle = { x: 100, y: 50 };

describe("areaCenter", () => {
  it("is the middle of the area", () => {
    expect(areaCenter(area)).toEqual(middle);
  });
});

describe("nudgeCursor", () => {
  it("moves the cursor one step in the arrow's direction", () => {
    expect(nudgeCursor(middle, "ArrowRight", area)).toEqual({
      x: middle.x + KEYBOARD_STEP_PX,
      y: middle.y,
    });
    expect(nudgeCursor(middle, "ArrowLeft", area)).toEqual({
      x: middle.x - KEYBOARD_STEP_PX,
      y: middle.y,
    });
    expect(nudgeCursor(middle, "ArrowUp", area)).toEqual({
      x: middle.x,
      y: middle.y - KEYBOARD_STEP_PX,
    });
    expect(nudgeCursor(middle, "ArrowDown", area)).toEqual({
      x: middle.x,
      y: middle.y + KEYBOARD_STEP_PX,
    });
  });

  it("keeps the cursor inside the area", () => {
    expect(nudgeCursor({ x: 0, y: 0 }, "ArrowLeft", area)).toEqual({
      x: 0,
      y: 0,
    });
    expect(nudgeCursor({ x: 200, y: 100 }, "ArrowDown", area)).toEqual({
      x: 200,
      y: 100,
    });
  });

  it("ignores keys that are not arrows", () => {
    expect(nudgeCursor(middle, "Enter", area)).toBeUndefined();
  });
});

describe("zoomDeltaForKey", () => {
  it("zooms in on + and on =, which shares its key without Shift", () => {
    expect(zoomDeltaForKey("+")).toBe(KEYBOARD_ZOOM_STEP);
    expect(zoomDeltaForKey("=")).toBe(KEYBOARD_ZOOM_STEP);
  });

  it("zooms out on -", () => {
    expect(zoomDeltaForKey("-")).toBe(-KEYBOARD_ZOOM_STEP);
  });

  it("ignores other keys", () => {
    expect(zoomDeltaForKey("a")).toBeUndefined();
  });
});
