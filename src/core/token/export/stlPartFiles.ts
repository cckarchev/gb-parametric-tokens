import { resolveColorGroupDisplay } from "../mesh/colorGroups";
import { TokenPart } from "../mesh/tokenPart";
import { ColorGroupSpec } from "../types";
import { meshToStlBinary } from "./stlBinary";

export type StlPartFile = { fileName: string; buffer: Uint8Array };

const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const buildStlPartFiles = (
  parts: TokenPart[],
  colorGroups: ColorGroupSpec[],
  baseFileName: string,
): StlPartFile[] => {
  if (parts.length === 1) {
    return [
      { fileName: `${baseFileName}.stl`, buffer: meshToStlBinary(parts[0].manifold.getMesh()) },
    ];
  }

  return parts.map((part) => {
    const display = resolveColorGroupDisplay(part.colorGroupId, colorGroups);
    const slug = slugify(display.name);

    return {
      fileName: `${baseFileName}-${slug}.stl`,
      buffer: meshToStlBinary(part.manifold.getMesh()),
    };
  });
};
