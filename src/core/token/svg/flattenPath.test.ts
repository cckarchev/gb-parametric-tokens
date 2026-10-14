import { describe, expect, it } from "vitest";

import { flattenPath } from "./flattenPath";

describe("flattenPath", () => {
  it("turns a move/line/close square into one 4-point contour", () => {
    const commands = [
      { type: "move" as const, x: 0, y: 0 },
      { type: "line" as const, x: 10, y: 0 },
      { type: "line" as const, x: 10, y: 10 },
      { type: "line" as const, x: 0, y: 10 },
      { type: "close" as const },
    ];

    expect(flattenPath(commands, 0.1)).toEqual([
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
    ]);
  });

  it("does not subdivide a cubic whose control points lie on the chord", () => {
    const commands = [
      { type: "move" as const, x: 0, y: 0 },
      { type: "cubic" as const, x1: 3, y1: 0, x2: 7, y2: 0, x: 10, y: 0 },
    ];

    expect(flattenPath(commands, 0.01)).toEqual([
      [
        [0, 0],
        [10, 0],
      ],
    ]);
  });

  it("subdivides a curved cubic until within tolerance", () => {
    const commands = [
      { type: "move" as const, x: 0, y: 0 },
      { type: "cubic" as const, x1: 0, y1: 10, x2: 10, y2: 10, x: 10, y: 0 },
    ];

    const contours = flattenPath(commands, 0.05);

    expect(contours[0].length).toBeGreaterThan(2);
    expect(contours[0][0]).toEqual([0, 0]);
    expect(contours[0].at(-1)).toEqual([10, 0]);
  });

  it("does not subdivide a quadratic whose control point lies on the chord", () => {
    const commands = [
      { type: "move" as const, x: 0, y: 0 },
      { type: "quad" as const, x1: 5, y1: 0, x: 10, y: 0 },
    ];

    expect(flattenPath(commands, 0.01)).toEqual([
      [
        [0, 0],
        [10, 0],
      ],
    ]);
  });

  it("subdivides a curved quadratic until within tolerance", () => {
    const commands = [
      { type: "move" as const, x: 0, y: 0 },
      { type: "quad" as const, x1: 5, y1: 10, x: 10, y: 0 },
    ];

    const contours = flattenPath(commands, 0.05);

    expect(contours[0].length).toBeGreaterThan(2);
    expect(contours[0][0]).toEqual([0, 0]);
    expect(contours[0].at(-1)).toEqual([10, 0]);
  });

  it("starts a new contour on every move", () => {
    const commands = [
      { type: "move" as const, x: 0, y: 0 },
      { type: "line" as const, x: 1, y: 0 },
      { type: "move" as const, x: 5, y: 5 },
      { type: "line" as const, x: 6, y: 5 },
    ];

    expect(flattenPath(commands, 0.1)).toEqual([
      [
        [0, 0],
        [1, 0],
      ],
      [
        [5, 5],
        [6, 5],
      ],
    ]);
  });
});
