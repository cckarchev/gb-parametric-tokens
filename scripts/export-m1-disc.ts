import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { meshToStlBinary } from "../src/core/token/export/stlBinary";
import { placeIcon } from "../src/core/token/geometry/iconPlacement";
import { buildTokenMesh } from "../src/core/token/mesh/buildTokenMesh";
import { PRINT_PROFILES } from "../src/core/token/printProfiles";
import { extractPathData } from "../src/core/token/svg/extractPathData";
import { flattenPath } from "../src/core/token/svg/flattenPath";
import { normalizeWinding } from "../src/core/token/svg/normalizeWinding";
import { parsePathData } from "../src/core/token/svg/parsePathData";
import { TokenSpec } from "../src/core/token/types";

const ICON_SVG_PATH = path.join(process.cwd(), "scad/svg/icon-generic-ball.svg");
const OUTPUT_PATH = path.join(process.cwd(), "raw-output/stl/m1-disc.stl");

const buildM1Spec = (): TokenSpec => ({
  version: 1,
  shape: { type: "disc", diameterMm: 25 },
  textLayout: "flat",
  lines: [],
  icons: [{ iconId: "generic-ball", side: "center", scale: 0.7 }],
  decorations: [],
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  colorGroups: [{ id: "base", name: "Base", color: "#416abb" }],
  printProfileId: "fdm-04",
  fitPolicy: { minTracking: 0, maxTracking: 0, minScale: 1, allowTwoLines: false },
});

const loadRawIconContours = (svgPath: string, bezierToleranceMm: number) => {
  const svgSource = readFileSync(svgPath, "utf8");
  const pathDataList = extractPathData(svgSource);

  return pathDataList.flatMap((d) => {
    const commands = parsePathData(d);

    return flattenPath(commands, bezierToleranceMm);
  });
};

const main = async () => {
  const spec = buildM1Spec();
  const printProfile = PRINT_PROFILES[spec.printProfileId];

  if (spec.shape.type !== "disc") {
    throw new Error("the M1 script only builds disc tokens");
  }

  const rawContours = loadRawIconContours(ICON_SVG_PATH, printProfile.bezierToleranceMm);
  const placedContours = placeIcon(rawContours, {
    targetDiameterMm: spec.shape.diameterMm,
    scale: spec.icons[0].scale,
  });

  // placeIcon flips Y (SVG is y-down), which reverses contour winding — normalize after,
  // never before, or the flip undoes the normalization.
  const iconContours = normalizeWinding(placedContours);

  const parts = await buildTokenMesh({
    spec,
    reliefComponents: [{ contours: iconContours, colorGroup: spec.icons[0]?.colorGroup }],
  });

  if (parts.length !== 1) {
    throw new Error(
      "the M1 script only writes a single STL — give icons[0] the base colorGroup or leave it unset",
    );
  }

  const stlBuffer = meshToStlBinary(parts[0].manifold.getMesh());

  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, stlBuffer);

  console.log(
    `Wrote ${OUTPUT_PATH} (${parts[0].manifold.getMesh().numTri} triangles, status: ${parts[0].manifold.status()})`,
  );
};

main();
