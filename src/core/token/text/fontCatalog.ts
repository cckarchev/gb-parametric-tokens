import { FontMetrics } from "./fontMetrics";

export type FontEntry = {
  id: string;
  name: string;
  // Under public/fonts.
  file: string;
  licenseFile: string;
  // Measured from the file (fontCatalog.test.ts checks them), stored so the spec builders can
  // size text before the worker has loaded any font.
  metrics: FontMetrics;
};

// Every font here is SIL Open Font License, shipped with its license beside it.
export const FONT_CATALOG: FontEntry[] = [
  {
    id: "saira-condensed-bold",
    name: "Saira Condensed Bold",
    file: "SairaCondensed-Bold.ttf",
    licenseFile: "SairaCondensed-OFL.txt",
    metrics: { ascentRatio: 0.688, stemWidthRatio: 0.129 },
  },
  {
    id: "fraunces-supersoft-black",
    name: "Fraunces SuperSoft Black",
    file: "Fraunces144ptSuperSoft-Black.otf",
    licenseFile: "Fraunces-OFL.txt",
    metrics: { ascentRatio: 0.7, stemWidthRatio: 0.1895 },
  },
  {
    id: "fira-sans-condensed-bold",
    name: "Fira Sans Condensed Bold",
    file: "FiraSansCondensed-Bold.ttf",
    licenseFile: "FiraSansCondensed-OFL.txt",
    metrics: { ascentRatio: 0.693, stemWidthRatio: 0.154 },
  },
  {
    // Made for low-vision readers: letters that are easy to confuse (I l 1, O 0, b d) are drawn
    // apart, which helps dyslexic readers too.
    id: "atkinson-hyperlegible-bold",
    name: "Atkinson Hyperlegible Bold",
    file: "AtkinsonHyperlegible-Bold.ttf",
    licenseFile: "AtkinsonHyperlegible-OFL.txt",
    metrics: { ascentRatio: 0.668, stemWidthRatio: 0.152 },
  },
  {
    id: "lilita-one",
    name: "Lilita One",
    file: "LilitaOne-Regular.ttf",
    licenseFile: "LilitaOne-OFL.txt",
    metrics: { ascentRatio: 0.701, stemWidthRatio: 0.182 },
  },
  {
    id: "germania-one",
    name: "Germania One",
    file: "GermaniaOne-Regular.ttf",
    licenseFile: "GermaniaOne-OFL.txt",
    metrics: { ascentRatio: 0.712, stemWidthRatio: 0.132 },
  },
];

// Fits a lot of text in a little room: every token's default except Momentum's.
export const DEFAULT_BODY_FONT_ID = "saira-condensed-bold";
// Momentum's "MP".
export const DEFAULT_DISPLAY_FONT_ID = "fraunces-supersoft-black";

const FONTS_DIRECTORY = "/fonts";

export const fontFilePath = (file: string): string => {
  return `${FONTS_DIRECTORY}/${file}`;
};

const DEFAULT_BODY_FONT_ENTRY = FONT_CATALOG.find((entry) => entry.id === DEFAULT_BODY_FONT_ID);

// An unknown id (a settings file from another version) falls back to the body font, which
// fits any text.
export const findFontEntry = (fontId: string | undefined): FontEntry => {
  const entry = FONT_CATALOG.find((candidate) => candidate.id === fontId);

  if (entry) {
    return entry;
  }

  if (!DEFAULT_BODY_FONT_ENTRY) {
    throw new Error(`The default font ${DEFAULT_BODY_FONT_ID} is missing from FONT_CATALOG.`);
  }

  return DEFAULT_BODY_FONT_ENTRY;
};
