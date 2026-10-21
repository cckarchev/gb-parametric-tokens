import { readFileSync } from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const TEST_FONT_PATH = "public/fonts/SairaCondensed-Bold.ttf";

export const loadFontFile = (filePath: string): opentype.Font => {
  const buffer = readFileSync(filePath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );

  return opentype.parse(arrayBuffer);
};

// The app's real font, since every expected measurement depends on it. Parsed once and shared;
// no test mutates it.
let parsedFont: opentype.Font | undefined;

export const loadTestFont = (): opentype.Font => {
  if (parsedFont) {
    return parsedFont;
  }

  parsedFont = loadFontFile(path.join(process.cwd(), TEST_FONT_PATH));

  return parsedFont;
};
