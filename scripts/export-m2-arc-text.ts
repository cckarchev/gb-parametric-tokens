import { mkdirSync, readFileSync, writeFileSync } from "fs";
import opentype from "opentype.js";
import path from "path";

import { contoursToSvgDocument } from "../src/core/token/export/svgDocument";
import { PRINT_PROFILES } from "../src/core/token/printProfiles";
import { ArcLineSpec, layoutArcText } from "../src/core/token/text/layoutArcText";
import { Vec2 } from "../src/core/token/types";

const FONT_PATH = path.join(process.cwd(), "public/fonts/BigNoodleTitling.ttf");
const OUTPUT_DIR = path.join(process.cwd(), "raw-output/svg");

const loadFont = (): opentype.Font => {
  const buffer = readFileSync(FONT_PATH);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  return opentype.parse(arrayBuffer);
};

const writeLinesAsSvg = (
  font: opentype.Font,
  lines: ArcLineSpec[],
  toleranceMm: number,
  outputFileName: string,
): void => {
  const contours: Vec2[][] = lines.flatMap((line) =>
    layoutArcText(font, line, toleranceMm, "svgYDown"),
  );
  const svg = contoursToSvgDocument(contours);
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(outputPath, svg);

  console.log(`Wrote ${outputPath} (${contours.length} contours)`);
};

const main = (): void => {
  const font = loadFont();
  const toleranceMm = PRINT_PROFILES["fdm-04"].bezierToleranceMm;

  writeLinesAsSvg(
    font,
    [{ text: "Poised used", sizeMm: 6, radiusMm: 20 }],
    toleranceMm,
    "m2-poised-used.svg",
  );

  writeLinesAsSvg(
    font,
    [
      { text: "Superior Strategy", sizeMm: 5, radiusMm: 20 },
      { text: "Additional activation", sizeMm: 5, radiusMm: 15 },
    ],
    toleranceMm,
    "m2-superior-strategy.svg",
  );
};

main();
