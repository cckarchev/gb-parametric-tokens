import { describe, expect, it } from "vitest";

import { TokenPart } from "../../mesh/tokenPart";
import {
  buildComponentsObjectXml,
  buildItemXml,
  buildObjectXml,
  colorToDisplayColor,
  escapeXmlAttribute,
  wrapThreeMfModelXml,
} from "./xml";

// One triangle, stored the way manifold-3d lays out a mesh: numProp floats per vertex, of which
// only the first three (x, y, z) belong in the 3MF file.
const PROPERTIES_PER_VERTEX = 4;

const fakeTrianglePart = (): TokenPart =>
  ({
    colorGroupId: "base",
    manifold: {
      getMesh: () => ({
        numVert: 3,
        numTri: 1,
        numProp: PROPERTIES_PER_VERTEX,
        vertProperties: [0, 0, 0, 9, 1, 0, 0, 9, 0, 1, 2, 9],
        triVerts: [0, 1, 2],
      }),
    },
  }) as unknown as TokenPart;

describe("escapeXmlAttribute", () => {
  it("escapes ampersands, quotes and angle brackets", () => {
    expect(escapeXmlAttribute(`Tapper & "Friends" <3>`)).toBe(
      "Tapper &amp; &quot;Friends&quot; &lt;3&gt;",
    );
  });
});

describe("colorToDisplayColor", () => {
  it("appends a fully opaque alpha channel", () => {
    expect(colorToDisplayColor("#2B2B2B")).toBe("#2B2B2BFF");
  });
});

describe("buildObjectXml", () => {
  it("writes only the position of each vertex and the corners of each triangle", () => {
    const xml = buildObjectXml(fakeTrianglePart(), 2, 0, "Tapper");

    expect(xml).toBe(
      `<object id="2" name="Tapper" pid="1" pindex="0" type="model">` +
        `<mesh><vertices>` +
        `<vertex x="0" y="0" z="0"/><vertex x="1" y="0" z="0"/><vertex x="0" y="1" z="2"/>` +
        `</vertices><triangles><triangle v1="0" v2="1" v3="2"/></triangles></mesh>` +
        `</object>`,
    );
  });

  it("escapes the display name", () => {
    const xml = buildObjectXml(fakeTrianglePart(), 2, 0, `A & "B"`);

    expect(xml).toContain('name="A &amp; &quot;B&quot;"');
  });
});

describe("buildComponentsObjectXml", () => {
  it("groups mesh objects into one named object, one component per mesh", () => {
    expect(buildComponentsObjectXml(7, [2, 3], "Casket: Poltergeists 1")).toBe(
      `<object id="7" name="Casket: Poltergeists 1" type="model">` +
        `<components><component objectid="2"/><component objectid="3"/></components>` +
        `</object>`,
    );
  });

  it("escapes the name", () => {
    expect(buildComponentsObjectXml(7, [2], `A & "B"`)).toContain('name="A &amp; &quot;B&quot;"');
  });
});

describe("buildItemXml", () => {
  it("places the object with a translation-only transform", () => {
    expect(buildItemXml(3, [10, 20])).toBe(
      `<item objectid="3" transform="1 0 0 0 1 0 0 0 1 10 20 0"/>`,
    );
  });
});

describe("wrapThreeMfModelXml", () => {
  it("puts the materials and objects under resources and the items under build", () => {
    const xml = wrapThreeMfModelXml("<base/>", "<object/>", "<item/>");

    expect(xml).toContain(`<model unit="millimeter"`);
    expect(xml).toContain(
      `<resources><basematerials id="1"><base/></basematerials><object/></resources>`,
    );
    expect(xml).toContain(`<build><item/></build></model>`);
  });
});
