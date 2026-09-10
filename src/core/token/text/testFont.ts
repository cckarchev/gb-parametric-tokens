import { readFileSync } from "fs";
import opentype from "opentype.js";
import path from "path";

const TEST_FONT_PATH = "public/fonts/SairaCondensed-Bold.ttf";

// The app's real font, not a stand-in: text layout is measured in glyph advances and contour
// points, so a different font would make every expected number in these tests arbitrary.
//
// Parsed once and shared. Every test that lays out text needs a font, and re-reading and
// re-parsing the file per test case was ~40KB of disk plus a full TTF parse each time, for a
// value none of them mutate.
let parsedFont: opentype.Font | undefined;

export const loadTestFont = (): opentype.Font => {
  if (parsedFont) {
    return parsedFont;
  }

  const buffer = readFileSync(path.join(process.cwd(), TEST_FONT_PATH));
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  parsedFont = opentype.parse(arrayBuffer);

  return parsedFont;
};
