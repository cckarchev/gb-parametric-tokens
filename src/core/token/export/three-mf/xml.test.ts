import { describe, expect, it } from "vitest";

import type { TokenPart } from "../../mesh/tokenPart";
import {
  buildItemXml,
  buildMeshObjectXml,
  buildMultiVolumeMeshXml,
  colorToDisplayColor,
  escapeXmlAttribute,
  wrapThreeMfModelXml,
} from "./xml";

// One triangle, stored the way manifold-3d lays out a mesh: numProp floats per vertex, of which
// only the first three (x, y, z) belong in the 3MF file.
const PROPERTIES_PER_VERTEX = 4;
const TRIANGLE_VERTEX_COUNT = 3;
const SKIPPED_PROPERTY = 9;

const fakeTrianglePart = (): TokenPart =>
  ({
    colorGroupId: "base",
    manifold: {
      getMesh: () => ({
        numVert: TRIANGLE_VERTEX_COUNT,
        numTri: 1,
        numProp: PROPERTIES_PER_VERTEX,
        // x, y, z, then a fourth property the 3MF writer must skip.
        vertProperties: [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 2],
        ].flatMap((position) => [...position, SKIPPED_PROPERTY]),
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

describe("buildMultiVolumeMeshXml", () => {
  it("writes only the position of each vertex and the corners of each triangle", () => {
    const { meshXml } = buildMultiVolumeMeshXml(
      [{ part: fakeTrianglePart(), materialIndex: 0, name: "Body" }],
      [0, 0],
    );

    expect(meshXml).toBe(
      `<mesh><vertices>` +
        `<vertex x="0" y="0" z="0"/><vertex x="1" y="0" z="0"/><vertex x="0" y="1" z="2"/>` +
        `</vertices><triangles><triangle v1="0" v2="1" v3="2"/></triangles></mesh>`,
    );
  });

  it("merges every volume into one mesh, shifting each volume onto its own vertices", () => {
    const { meshXml } = buildMultiVolumeMeshXml(
      [
        { part: fakeTrianglePart(), materialIndex: 0, name: "Body" },
        { part: fakeTrianglePart(), materialIndex: 0, name: "Details" },
      ],
      [0, 0],
    );

    const partCount = 2;

    expect(meshXml.split("<vertex ").length - 1).toBe(
      partCount * TRIANGLE_VERTEX_COUNT,
    );
    expect(meshXml).toContain('<triangle v1="3" v2="4" v3="5"/>');
  });

  it("takes the first volume's material as the object's and tags the triangles of any other", () => {
    const { meshXml, objectMaterialIndex } = buildMultiVolumeMeshXml(
      [
        { part: fakeTrianglePart(), materialIndex: 2, name: "Body" },
        { part: fakeTrianglePart(), materialIndex: 1, name: "Details" },
      ],
      [0, 0],
    );

    expect(objectMaterialIndex).toBe(2);
    expect(meshXml).toContain('<triangle v1="0" v2="1" v3="2"/>');
    expect(meshXml).toContain(
      '<triangle v1="3" v2="4" v3="5" pid="1" p1="1"/>',
    );
  });

  it("reports the triangle range each volume occupies in the merged mesh", () => {
    const { volumeRanges } = buildMultiVolumeMeshXml(
      [
        { part: fakeTrianglePart(), materialIndex: 0, name: "Body" },
        { part: fakeTrianglePart(), materialIndex: 1, name: "Details" },
      ],
      [0, 0],
    );

    expect(volumeRanges).toEqual([
      { name: "Body", firstTriangleId: 0, lastTriangleId: 0 },
      { name: "Details", firstTriangleId: 1, lastTriangleId: 1 },
    ]);
  });

  it("bakes the copy's plate offset into every vertex", () => {
    const plateOffset = { x: 10, y: 20 };

    const { meshXml } = buildMultiVolumeMeshXml(
      [{ part: fakeTrianglePart(), materialIndex: 0, name: "Body" }],
      [plateOffset.x, plateOffset.y],
    );

    expect(meshXml).toContain(
      '<vertex x="10" y="20" z="0"/><vertex x="11" y="20" z="0"/><vertex x="10" y="21" z="2"/>',
    );
  });
});

describe("buildMeshObjectXml", () => {
  it("wraps a mesh in a named object with its default material", () => {
    expect(buildMeshObjectXml(2, "Tapper", 0, "<mesh/>")).toBe(
      '<object id="2" name="Tapper" pid="1" pindex="0" type="model"><mesh/></object>',
    );
  });

  it("escapes the name", () => {
    expect(buildMeshObjectXml(2, `A & "B"`, 0, "<mesh/>")).toContain(
      'name="A &amp; &quot;B&quot;"',
    );
  });
});

describe("buildItemXml", () => {
  it("places the object without a transform, since its vertices are already in place", () => {
    const objectId = 3;

    expect(buildItemXml(objectId)).toBe(`<item objectid="${objectId}"/>`);
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
