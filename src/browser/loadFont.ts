import opentype, { type Font } from "opentype.js";

import { findFontEntry, fontFilePath } from "@/core/token/text/fontCatalog";

const fetchFont = async (url: string): Promise<Font> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load font: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return opentype.parse(arrayBuffer);
};

const fontPromisesById = new Map<string, Promise<Font>>();

// Only the fonts some token uses are fetched, each once. A failed load is forgotten rather than
// cached, so a transient network error fails only the request that hit it and the next one
// tries again, instead of every request until a reload.
export const loadCatalogFont = (fontId: string | undefined): Promise<Font> => {
  const entry = findFontEntry(fontId);
  const cachedPromise = fontPromisesById.get(entry.id);

  if (cachedPromise) {
    return cachedPromise;
  }

  const fontPromise = fetchFont(fontFilePath(entry.file)).catch((error: unknown) => {
    fontPromisesById.delete(entry.id);
    throw error;
  });

  fontPromisesById.set(entry.id, fontPromise);

  return fontPromise;
};
