import { describe, expect, it } from "vitest";

import { buildGridOverlaySvg } from "./svgGrid";

describe("buildGridOverlaySvg", () => {
  it("draws a vertical and a horizontal line at every 10mm (1cm) step across the given bounds", () => {
    const svg = buildGridOverlaySvg({ x: 0, y: 0, width: 20, height: 10 });

    // Vertical lines at x = 0, 10, 20; horizontal lines at y = 0, 10.
    expect(svg).toContain("M0,0 L0,10");
    expect(svg).toContain("M10,0 L10,10");
    expect(svg).toContain("M20,0 L20,10");
    expect(svg).toContain("M0,0 L20,0");
    expect(svg).toContain("M0,10 L20,10");
  });

  it("anchors lines to absolute 10mm marks that fall within the bounds, not to the bounds' own offset", () => {
    const svg = buildGridOverlaySvg({ x: 3, y: 5, width: 14, height: 8 });

    // Bounds span x: 3..17, y: 5..13. The only absolute 10mm mark inside each axis is 10.
    // Lines run the full length of the opposite axis so the mark reaches the bounds' edges.
    expect(svg).toContain("M10,5 L10,13");
    expect(svg).toContain("M3,10 L17,10");
  });

  it("wraps the lines in a group that blends against both light and dark backgrounds and never prints", () => {
    const svg = buildGridOverlaySvg({ x: 0, y: 0, width: 10, height: 10 });

    expect(svg).toContain("mix-blend-mode:difference");
    expect(svg).toContain('data-role="grid-overlay"');
  });
});
