import { describe, expect, it } from "vitest";

import { Vec2 } from "../types";
import { contoursToSvgDocument } from "./svgDocument";

describe("contoursToSvgDocument", () => {
  it("wraps a single path with fill-rule evenodd inside an svg root", () => {
    const square: Vec2[][] = [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
    ];

    const svg = contoursToSvgDocument(square);

    expect(svg).toContain("<svg");
    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).toContain("M0,0 L10,0 L10,10 L0,10 Z");
  });

  it("computes a viewBox that contains every point plus padding", () => {
    const square: Vec2[][] = [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
    ];

    const svg = contoursToSvgDocument(square, { paddingMm: 2 });

    expect(svg).toContain('viewBox="-2 -2 14 14"');
  });

  it("combines multiple contours into one path with separate M...Z segments", () => {
    const contours: Vec2[][] = [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      [
        [5, 5],
        [6, 5],
        [6, 6],
        [5, 6],
      ],
    ];

    const svg = contoursToSvgDocument(contours);

    expect(svg).toContain("M0,0 L1,0 L1,1 L0,1 Z M5,5 L6,5 L6,6 L5,6 Z");
  });
});
