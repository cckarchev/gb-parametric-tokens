import { describe, expect, it } from "vitest";

import { ColorGroupSpec, Vec2 } from "../types";
import { buildTokenPathsSvg } from "./svgDocument";

const BASE_COLOR = "#2B2B2B";
const TEXT_COLOR = "#FFFFFF";

const colorGroups: ColorGroupSpec[] = [
  { id: "base", name: "Base", color: BASE_COLOR },
  { id: "text", name: "Text", color: TEXT_COLOR },
];

const square: Vec2[] = [
  [0, 0],
  [1, 0],
  [1, 1],
];

describe("buildTokenPathsSvg", () => {
  it("paints the base first, then one evenodd path per color group", () => {
    const relief = new Map<string, Vec2[][]>([["text", [square]]]);

    const paths = buildTokenPathsSvg([square], relief, colorGroups);

    expect(paths).toEqual([
      `<path d="M0,0 L1,0 L1,1 Z" fill="${BASE_COLOR}" fill-rule="evenodd" />`,
      `<path d="M0,0 L1,0 L1,1 Z" fill="${TEXT_COLOR}" fill-rule="evenodd" />`,
    ]);
  });

  it("joins several contours of one color group into a single path", () => {
    const shifted: Vec2[] = [
      [5, 5],
      [6, 5],
      [6, 6],
    ];

    const [basePath] = buildTokenPathsSvg([square, shifted], new Map(), colorGroups);

    expect(basePath).toContain('d="M0,0 L1,0 L1,1 Z M5,5 L6,5 L6,6 Z"');
  });

  it("falls back to a neutral gray for a color group the token does not define", () => {
    const relief = new Map<string, Vec2[][]>([["missing", [square]]]);

    const paths = buildTokenPathsSvg([square], relief, colorGroups);

    expect(paths[1]).toContain('fill="#CCCCCC"');
  });
});
