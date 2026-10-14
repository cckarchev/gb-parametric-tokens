import { readFileSync } from "fs";
import opentype from "opentype.js";
import path from "path";

const TEST_FONT_PATH = "public/fonts/SairaCondensed-Bold.ttf";

// The app's real font, since every expected measurement depends on it. Parsed once and shared;
// no test mutates it.
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
