import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { buildThreeMfArchive } from "./threeMfArchive";

describe("buildThreeMfArchive", () => {
  it("packages the model XML alongside the required 3MF package parts", () => {
    const modelXml = '<?xml version="1.0" encoding="UTF-8"?><model/>';
    const archive = buildThreeMfArchive(modelXml);
    const unpacked = unzipSync(archive);

    expect(Object.keys(unpacked).sort()).toEqual([
      "3D/3dmodel.model",
      "[Content_Types].xml",
      "_rels/.rels",
    ]);

    const decoder = new TextDecoder();

    expect(decoder.decode(unpacked["3D/3dmodel.model"])).toBe(modelXml);
    expect(decoder.decode(unpacked["[Content_Types].xml"])).toContain("3dmanufacturing-3dmodel");
    expect(decoder.decode(unpacked["_rels/.rels"])).toContain("/3D/3dmodel.model");
  });
});
