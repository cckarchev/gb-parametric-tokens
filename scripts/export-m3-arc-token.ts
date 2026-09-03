import { mkdirSync, readFileSync, writeFileSync } from "fs";
import opentype from "opentype.js";
import path from "path";

import { meshToStlBinary } from "../src/core/token/export/stlBinary";
import { placeIcon, translateContours } from "../src/core/token/geometry/iconPlacement";
import {
  computeInnerRadiusMm,
  computeNobPlacements,
  computeOuterRadiusMm,
  computeSweepDeg,
} from "../src/core/token/geometry/nobPlacement";
import { buildArcTokenMesh } from "../src/core/token/mesh/buildArcTokenMesh";
import { PRINT_PROFILES } from "../src/core/token/printProfiles";
import { extractPathData } from "../src/core/token/svg/extractPathData";
import { flattenPath } from "../src/core/token/svg/flattenPath";
import { normalizeWinding } from "../src/core/token/svg/normalizeWinding";
import { parsePathData } from "../src/core/token/svg/parsePathData";
import { AutoFitLineOutput, autoFitLine } from "../src/core/token/text/autoFit";
import { layoutArcText } from "../src/core/token/text/layoutArcText";
import { FitPolicy, ShapeSpec, StyleSpec, Vec2 } from "../src/core/token/types";
import { validateMinStrokeWidth } from "../src/core/token/validation/validateMinStrokeWidth";

const FONT_PATH = path.join(process.cwd(), "public/fonts/BigNoodleTitling.ttf");
const LEFT_ICON_PATH = path.join(process.cwd(), "scad/svg/icon-generic-ball.svg");
const RIGHT_ICON_PATH = path.join(process.cwd(), "scad/svg/icon-generic-fist.svg");
const OUTPUT_DIR = path.join(process.cwd(), "raw-output/stl");

const CENTER_ANGLE_DEG = 90;
const NOB_TEXT_CLEARANCE_DEG = 6; // keeps text from visually colliding with the nobs at each sweep end

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

const buildTextContours = (
  font: opentype.Font,
  lines: AutoFitLineOutput[],
  toleranceMm: number,
): Vec2[][] => {
  return lines.flatMap((line) =>
    layoutArcText(
      font,
      {
        text: line.text,
        sizeMm: line.sizeMm,
        radiusMm: line.radiusMm,
        centerAngleDeg: CENTER_ANGLE_DEG,
        trackingMm: line.trackingMm,
      },
      toleranceMm,
      "mathYUp",
    ),
  );
};

// Builds and writes one token's mesh from already-fitted text lines. Fit computation
// (how many autoFitLine calls, and how their results are combined) is the one thing
// that genuinely differs between calibration cases, so it stays in the caller.
const exportToken = async (
  font: opentype.Font,
  fittedLines: AutoFitLineOutput[],
  outputFileName: string,
): Promise<void> => {
  const printProfile = PRINT_PROFILES["fdm-04"];
  const nobPlacements = computeNobPlacements(SHAPE, CENTER_ANGLE_DEG);
  const nobDiameterMm = SHAPE.nobDiameterMm;

  const leftIconContours = loadIconContoursAt(
    LEFT_ICON_PATH,
    nobPlacements.left.position,
    nobDiameterMm,
    printProfile.bezierToleranceMm,
  );
  const rightIconContours = loadIconContoursAt(
    RIGHT_ICON_PATH,
    nobPlacements.right.position,
    nobDiameterMm,
    printProfile.bezierToleranceMm,
  );
  const textContours = buildTextContours(font, fittedLines, printProfile.bezierToleranceMm);

  const validation = await validateMinStrokeWidth(
    [...leftIconContours, ...rightIconContours, ...textContours],
    printProfile.minStrokeWidthMm,
  );

  console.log(
    `${outputFileName}: printability ${validation.valid ? "OK" : "FAILED"} ` +
      `(area before ${validation.areaBeforeMm2.toFixed(2)}mm2, after erosion ${validation.areaAfterErosionMm2.toFixed(2)}mm2; ` +
      `${validation.vanishedFeatureCount} of ${validation.featureCount} features vanished)`,
  );

  const parts = await buildArcTokenMesh({
    shape: SHAPE,
    centerAngleDeg: CENTER_ANGLE_DEG,
    style: STYLE,
    nobPositions: { left: nobPlacements.left.position, right: nobPlacements.right.position },
    reliefComponents: [
      { contours: leftIconContours },
      { contours: rightIconContours },
      { contours: textContours },
    ],
  });

  if (parts.length !== 1) {
    throw new Error(
      "the M3 script only writes a single STL — this calibration token never uses a second colorGroup",
    );
  }

  const stlBuffer = meshToStlBinary(parts[0].manifold.getMesh());
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(outputPath, stlBuffer);

  console.log(
    `Wrote ${outputPath} (${parts[0].manifold.getMesh().numTri} triangles, status: ${parts[0].manifold.status()})`,
  );
};

const warnIfTruncated = (sourceText: string, outputFileName: string, truncated: boolean): void => {
  if (truncated) {
    console.warn(`WARNING: "${sourceText}" had to be truncated to fit ${outputFileName}`);
  }
};

// A fit call may split its input into two lines of its own, each offset from the radius it
// was handed, so a fitted radius is not guaranteed to be the one we asked for. Text outside
// [innerR, outerR] would float off the ribbon, which is a correctness bug rather than a
// degraded-but-usable result, so this fails hard instead of warning.
const assertLinesFitInsideRibbon = (sourceText: string, lines: AutoFitLineOutput[]): void => {
  const innerRadiusMm = computeInnerRadiusMm();
  const outerRadiusMm = computeOuterRadiusMm(SHAPE);

  for (const line of lines) {
    const isInsideRibbon = line.radiusMm >= innerRadiusMm && line.radiusMm <= outerRadiusMm;

    if (!isInsideRibbon) {
      throw new Error(
        `Fitted line "${line.text}" (from "${sourceText}") landed at radius ` +
          `${line.radiusMm}mm, outside the ribbon's [${innerRadiusMm}, ${outerRadiusMm}]mm band`,
      );
    }
  }
};

const main = async (): Promise<void> => {
  const font = loadFont();
  const printProfile = PRINT_PROFILES["fdm-04"];
  const availableSweepDeg = computeSweepDeg(SHAPE) - 2 * NOB_TEXT_CLEARANCE_DEG;

  const poisedUsedFit = autoFitLine(
    font,
    { text: "Poised used", sizeMm: 6, radiusMm: 37.5, availableSweepDeg },
    FIT_POLICY,
    printProfile,
  );

  warnIfTruncated("Poised used", "m3-poised-used.stl", poisedUsedFit.truncated);
  assertLinesFitInsideRibbon("Poised used", poisedUsedFit.lines);

  await exportToken(font, poisedUsedFit.lines, "m3-poised-used.stl");

  const fitOuter = autoFitLine(
    font,
    { text: "Superior Strategy", sizeMm: 5, radiusMm: 41, availableSweepDeg },
    FIT_POLICY,
    printProfile,
  );
  const fitInner = autoFitLine(
    font,
    { text: "Additional activation", sizeMm: 5, radiusMm: 34, availableSweepDeg },
    FIT_POLICY,
    printProfile,
  );

  warnIfTruncated("Superior Strategy", "m3-superior-strategy.stl", fitOuter.truncated);
  warnIfTruncated("Additional activation", "m3-superior-strategy.stl", fitInner.truncated);
  assertLinesFitInsideRibbon("Superior Strategy", fitOuter.lines);
  assertLinesFitInsideRibbon("Additional activation", fitInner.lines);

  await exportToken(font, [...fitOuter.lines, ...fitInner.lines], "m3-superior-strategy.stl");
};

main();
