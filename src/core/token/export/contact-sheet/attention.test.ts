import { describe, expect, it } from "vitest";

import { buildAttentionMarkerSvg } from "./attention";

describe("buildAttentionMarkerSvg", () => {
  it("draws a dashed outline at the given cell position and size", () => {
    const cell = { x: 10, y: 20, width: 30, height: 40 };
    const svg = buildAttentionMarkerSvg(
      cell.x,
      cell.y,
      cell.width,
      cell.height,
      "Beer Token needs attention",
    );

    expect(svg).toContain('data-role="attention-marker"');
    expect(svg).toContain(
      '<rect x="10" y="20" width="30" height="40" fill="none" stroke="#ff6b6b" stroke-width="0.6" stroke-dasharray="2 1" />',
    );
  });

  it("includes the message as a title element for a native hover tooltip", () => {
    const svg = buildAttentionMarkerSvg(
      0,
      0,
      10,
      10,
      "Beer Token needs attention",
    );

    expect(svg).toContain("<title>Beer Token needs attention</title>");
  });

  it("escapes XML-sensitive characters in the message", () => {
    const svg = buildAttentionMarkerSvg(0, 0, 10, 10, 'Token "A" <B> & C');

    expect(svg).toContain(
      "<title>Token &quot;A&quot; &lt;B&gt; &amp; C</title>",
    );
  });
});
