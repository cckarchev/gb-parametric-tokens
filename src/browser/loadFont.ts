import opentype, { type Font } from "opentype.js";

const FONT_URL = "/fonts/CooperBlack.otf";

export const loadFont = async (): Promise<Font> => {
  const response = await fetch(FONT_URL);

  if (!response.ok) {
    throw new Error(`Failed to load font: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return opentype.parse(arrayBuffer);
};
