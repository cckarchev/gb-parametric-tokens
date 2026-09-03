import { mkdirSync, readFileSync, writeFileSync } from "fs";
import opentype from "opentype.js";
import path from "path";

import { buildStlPartFiles } from "../src/core/token/export/stlPartFiles";
import { buildThreeMfArchive } from "../src/core/token/export/threeMfArchive";
import { buildThreeMfModelXml } from "../src/core/token/export/threeMfModel";
import { computePlateOffsets } from "../src/core/token/geometry/computePlateOffsets";
import { placeIcon, translateContours } from "../src/core/token/geometry/iconPlacement";
import { computeNobPlacements, computeSweepDeg } from "../src/core/token/geometry/nobPlacement";
import { buildArcTokenMesh } from "../src/core/token/mesh/buildArcTokenMesh";
import { plateTokenParts } from "../src/core/token/mesh/plateTokenParts";
import { PRINT_PROFILES } from "../src/core/token/printProfiles";
import { extractPathData } from "../src/core/token/svg/extractPathData";
import { flattenPath } from "../src/core/token/svg/flattenPath";
import { normalizeWinding } from "../src/core/token/svg/normalizeWinding";
import { parsePathData } from "../src/core/token/svg/parsePathData";
import { autoFitLine } from "../src/core/token/text/autoFit";
import { layoutArcText } from "../src/core/token/text/layoutArcText";
import { ColorGroupSpec, FitPolicy, ShapeSpec, StyleSpec, Vec2 } from "../src/core/token/types";
import { validateMinStrokeWidth } from "../src/core/token/validation/validateMinStrokeWidth";

const FONT_PATH = path.join(process.cwd(), "public/fonts/BigNoodleTitling.ttf");
const LEFT_ICON_PATH = path.join(process.cwd(), "scad/svg/icon-generic-ball.svg");
const RIGHT_ICON_PATH = path.join(process.cwd(), "scad/svg/icon-generic-fist.svg");
const OUTPUT_DIR = path.join(process.cwd(), "raw-output/stl");
const BASE_FILE_NAME = "m4-momentum-token";

const CENTER_ANGLE_DEG = 90;
const NOB_TEXT_CLEARANCE_DEG = 6;

const BASE_COLOR_GROUP: ColorGroupSpec = { id: "base", name: "Base", color: "#2B2B2B" };
const ACCENT_COLOR_GROUP: ColorGroupSpec = { id: "accent", name: "Accent", color: "#C9A13B" };
const COLOR_GROUPS: ColorGroupSpec[] = [BASE_COLOR_GROUP, ACCENT_COLOR_GROUP];

const SHAPE: Extract<ShapeSpec, { type: "arc" }> = {
  type: "arc",
  ribbonWidthMm: 15,
  ribbonLengthMm: 20,
  nobDiameterMm: 24,
};

const STYLE: StyleSpec = { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 };
const FIT_POLICY: FitPolicy = {
  minTracking: 0,
  maxTracking: 0.3,
  minScale: 0.7,
  allowTwoLines: true,
};
const PLATE_LAYOUT = { count: 4, columns: 2, spacingMm: 100 };

const loadFont = (): opentype.Font => {
  const buffer = readFileSync(FONT_PATH);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  return opentype.parse(arrayBuffer);
};

const loadIconContoursAt = (
  svgPath: string,
  center: Vec2,
  targetDiameterMm: number,
  toleranceMm: number,
): Vec2[][] => {
  const svgSource = readFileSync(svgPath, "utf8");
  const pathDataList = extractPathData(svgSource);
  const rawContours = pathDataList.flatMap((d) => flattenPath(parsePathData(d), toleranceMm));
  const placed = placeIcon(rawContours, { targetDiameterMm, scale: 0.7 });

  // placeIcon flips Y; normalizeWinding must run after, same trap M1 documented.
  const normalized = normalizeWinding(placed);

  return translateContours(normalized, center);
};

const main = async (): Promise<void> => {
  const font = loadFont();
  const printProfile = PRINT_PROFILES["fdm-04"];
  const availableSweepDeg = computeSweepDeg(SHAPE) - 2 * NOB_TEXT_CLEARANCE_DEG;
  const nobPlacements = computeNobPlacements(SHAPE, CENTER_ANGLE_DEG);

  const fit = autoFitLine(
    font,
    { text: "Momentum", sizeMm: 6, radiusMm: 37.5, availableSweepDeg },
    FIT_POLICY,
    printProfile,
  );

  const leftIconContours = loadIconContoursAt(
    LEFT_ICON_PATH,
    nobPlacements.left.position,
    SHAPE.nobDiameterMm,
    printProfile.bezierToleranceMm,
  );
  const rightIconContours = loadIconContoursAt(
    RIGHT_ICON_PATH,
    nobPlacements.right.position,
    SHAPE.nobDiameterMm,
    printProfile.bezierToleranceMm,
  );
  const textContours = fit.lines.flatMap((line) =>
    layoutArcText(
      font,
      {
        text: line.text,
        sizeMm: line.sizeMm,
        radiusMm: line.radiusMm,
        centerAngleDeg: CENTER_ANGLE_DEG,
        trackingMm: line.trackingMm,
      },
      printProfile.bezierToleranceMm,
      "mathYUp",
    ),
  );

  // Base body in one color, raised icons + text in a second — the common case per §10
  // ("el caso común es dos colores, no cuatro") — demonstrating the multipart split end to end.
  const reliefComponents = [
    { contours: leftIconContours, colorGroup: ACCENT_COLOR_GROUP.id },
    { contours: rightIconContours, colorGroup: ACCENT_COLOR_GROUP.id },
    { contours: textContours, colorGroup: ACCENT_COLOR_GROUP.id },
  ];

  const validation = await validateMinStrokeWidth(
    reliefComponents.flatMap((component) => component.contours),
    printProfile.minStrokeWidthMm,
  );

  console.log(
    `printability ${validation.valid ? "OK" : "FAILED"} ` +
      `(area before ${validation.areaBeforeMm2.toFixed(2)}mm2, after erosion ${validation.areaAfterErosionMm2.toFixed(2)}mm2; ` +
      `${validation.vanishedFeatureCount} of ${validation.featureCount} features vanished)`,
  );

  const parts = await buildArcTokenMesh({
    shape: SHAPE,
    centerAngleDeg: CENTER_ANGLE_DEG,
    style: STYLE,
    nobPositions: { left: nobPlacements.left.position, right: nobPlacements.right.position },
    reliefComponents,
  });

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const plateOffsets = computePlateOffsets(PLATE_LAYOUT);

  // STL has no instancing: merge the plate copies into real geometry before writing.
  const platedPartsForStl = plateTokenParts(parts, plateOffsets);

  for (const file of buildStlPartFiles(platedPartsForStl, COLOR_GROUPS, BASE_FILE_NAME)) {
    writeFileSync(path.join(OUTPUT_DIR, file.fileName), file.buffer);
    console.log(`Wrote ${file.fileName} (${plateOffsets.length} plated copies merged)`);
  }

  // 3MF supports instancing: geometry stays defined once per part, the plate is N <item> transforms.
  const modelXml = buildThreeMfModelXml(parts, COLOR_GROUPS, plateOffsets);
  const archive = buildThreeMfArchive(modelXml);
  const threeMfPath = path.join(OUTPUT_DIR, `${BASE_FILE_NAME}.3mf`);

  writeFileSync(threeMfPath, archive);
  console.log(
    `Wrote ${threeMfPath} (${parts.length} parts x ${plateOffsets.length} plate copies, instanced not duplicated)`,
  );
};

main();
