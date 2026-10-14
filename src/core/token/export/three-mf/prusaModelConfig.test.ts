import { describe, expect, it } from "vitest";

import { buildPrusaModelConfigXml } from "./prusaModelConfig";

describe("buildPrusaModelConfigXml", () => {
  it("names each object, a single instance, and lists its volumes by triangle range", () => {
    const xml = buildPrusaModelConfigXml([
      {
        objectId: 2,
        name: "Momentum",
        volumeRanges: [
          { name: "Body", firstTriangleId: 0, lastTriangleId: 9 },
          { name: "Details", firstTriangleId: 10, lastTriangleId: 14 },
        ],
      },
    ]);

    expect(xml).toBe(
      `<?xml version="1.0" encoding="UTF-8"?>` +
        `<config>` +
        `<object id="2" instances_count="1">` +
        `<metadata type="object" key="name" value="Momentum"/>` +
        `<volume firstid="0" lastid="9"><metadata type="volume" key="name" value="Body"/></volume>` +
        `<volume firstid="10" lastid="14"><metadata type="volume" key="name" value="Details"/></volume>` +
        `</object>` +
        `</config>`,
    );
  });

  it("escapes names", () => {
    const xml = buildPrusaModelConfigXml([
      {
        objectId: 2,
        name: `A & "B"`,
        volumeRanges: [{ name: "<Body>", firstTriangleId: 0, lastTriangleId: 0 }],
      },
    ]);

    expect(xml).toContain('value="A &amp; &quot;B&quot;"');
    expect(xml).toContain('value="&lt;Body&gt;"');
  });
});
