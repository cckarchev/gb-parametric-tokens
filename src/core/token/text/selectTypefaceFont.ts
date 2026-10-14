import type { Font } from "opentype.js";

import { TokenSpec, Typeface } from "../types";

export type TypefaceFonts = Record<Typeface, Font>;

export const selectTypefaceFont = (
  spec: Pick<TokenSpec, "typeface">,
  fonts: TypefaceFonts,
): Font => {
  const typeface = spec.typeface ?? "body";

  return fonts[typeface];
};
