import opentype, { type Font } from "opentype.js";

import { TypefaceFonts } from "@/core/token/text/selectTypefaceFont";
import { Typeface } from "@/core/token/types";

const FONT_URLS: Record<Typeface, string> = {
  body: "/fonts/SairaCondensed-Bold.ttf",
  display: "/fonts/Fraunces144ptSuperSoft-Black.otf",
};

const loadFont = async (url: string): Promise<Font> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load font: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return opentype.parse(arrayBuffer);
};

export const loadFonts = async (): Promise<TypefaceFonts> => {
  const [body, display] = await Promise.all([
    loadFont(FONT_URLS.body),
    loadFont(FONT_URLS.display),
  ]);

  return { body, display };
};
