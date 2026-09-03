import { describe, expect, it } from "vitest";

import { parsePathData } from "./parsePathData";

describe("parsePathData", () => {
  it("parses an absolute move, line, close", () => {
    expect(parsePathData("M 10 20 L 30 40 Z")).toEqual([
      { type: "move", x: 10, y: 20 },
      { type: "line", x: 30, y: 40 },
      { type: "close" },
    ]);
  });

  it("treats extra coordinate pairs after M as implicit relative linetos", () => {
    expect(parsePathData("m 10 20 5 5")).toEqual([
      { type: "move", x: 10, y: 20 },
      { type: "line", x: 15, y: 25 },
    ]);
  });

  it("chains repeated cubic groups after a single C", () => {
    expect(parsePathData("M0 0 C 1 1 2 2 3 3 4 4 5 5 6 6")).toEqual([
      { type: "move", x: 0, y: 0 },
      { type: "cubic", x1: 1, y1: 1, x2: 2, y2: 2, x: 3, y: 3 },
      { type: "cubic", x1: 4, y1: 4, x2: 5, y2: 5, x: 6, y: 6 },
    ]);
  });

  it("accumulates relative coordinates against the current point", () => {
    expect(parsePathData("M 5 5 c 1 1 2 2 3 3")).toEqual([
      { type: "move", x: 5, y: 5 },
      { type: "cubic", x1: 6, y1: 6, x2: 7, y2: 7, x: 8, y: 8 },
    ]);
  });

  it("parses absolute and relative horizontal linetos", () => {
    expect(parsePathData("M 0 0 H 10 h 5")).toEqual([
      { type: "move", x: 0, y: 0 },
      { type: "line", x: 10, y: 0 },
      { type: "line", x: 15, y: 0 },
    ]);
  });

  it("parses absolute and relative vertical linetos", () => {
    expect(parsePathData("M 0 0 V 10 v 5")).toEqual([
      { type: "move", x: 0, y: 0 },
      { type: "line", x: 0, y: 10 },
      { type: "line", x: 0, y: 15 },
    ]);
  });

  it("reflects the previous cubic's control point for a smooth curve", () => {
    expect(parsePathData("M 0 0 C 0 10 10 10 10 0 S 20 -10 20 0")).toEqual([
      { type: "move", x: 0, y: 0 },
      { type: "cubic", x1: 0, y1: 10, x2: 10, y2: 10, x: 10, y: 0 },
      { type: "cubic", x1: 10, y1: -10, x2: 20, y2: -10, x: 20, y: 0 },
    ]);
  });

  it("uses the current point as the first control when S has no preceding cubic", () => {
    expect(parsePathData("M 5 5 S 10 0 10 5")).toEqual([
      { type: "move", x: 5, y: 5 },
      { type: "cubic", x1: 5, y1: 5, x2: 10, y2: 0, x: 10, y: 5 },
    ]);
  });

  it("chains repeated S groups, reflecting off the previous one each time", () => {
    expect(parsePathData("M 0 0 C 0 10 10 10 10 0 S 20 -10 20 0 30 10 30 0")).toEqual([
      { type: "move", x: 0, y: 0 },
      { type: "cubic", x1: 0, y1: 10, x2: 10, y2: 10, x: 10, y: 0 },
      { type: "cubic", x1: 10, y1: -10, x2: 20, y2: -10, x: 20, y: 0 },
      { type: "cubic", x1: 20, y1: 10, x2: 30, y2: 10, x: 30, y: 0 },
    ]);
  });
});
