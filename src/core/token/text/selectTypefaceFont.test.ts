import type { Font } from "opentype.js";
import { describe, expect, it } from "vitest";

import { selectTypefaceFont } from "./selectTypefaceFont";

// Only identity matters here, so stand-ins do for parsed fonts.
const bodyFont = { names: { fullName: { en: "body" } } } as unknown as Font;
const displayFont = { names: { fullName: { en: "display" } } } as unknown as Font;
const fonts = { body: bodyFont, display: displayFont };

describe("selectTypefaceFont", () => {
  it("uses the body font when the token names no typeface", () => {
    expect(selectTypefaceFont({}, fonts)).toBe(bodyFont);
  });

  it("uses the font of the typeface the token names", () => {
    expect(selectTypefaceFont({ typeface: "display" }, fonts)).toBe(displayFont);
  });
});
