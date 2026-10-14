import type { Glyph, Path as OpentypePath } from "opentype.js";

import { flipContoursY } from "../geometry/contourTransforms";
import { flattenPath } from "../svg/flattenPath";
import { normalizeWinding } from "../svg/normalizeWinding";
import type { PathCommand } from "../svg/parsePathData";
import { Vec2 } from "../types";

const glyphPathToCommands = (path: OpentypePath): PathCommand[] => {
  return path.commands.map((command): PathCommand => {
    if (command.type === "M") {
      return { type: "move", x: command.x, y: command.y };
    }

    if (command.type === "L") {
      return { type: "line", x: command.x, y: command.y };
    }

    if (command.type === "C") {
      return {
        type: "cubic",
        x1: command.x1,
        y1: command.y1,
        x2: command.x2,
        y2: command.y2,
        x: command.x,
        y: command.y,
      };
    }

    if (command.type === "Q") {
      return { type: "quad", x1: command.x1, y1: command.y1, x: command.x, y: command.y };
    }

    return { type: "close" };
  });
};

export const getGlyphContours = (
  glyph: Glyph,
  sizeMm: number,
  unitsPerEm: number,
  toleranceMm: number,
): Vec2[][] => {
  const path = glyph.getPath(0, 0, sizeMm);
  const commands = glyphPathToCommands(path);
  const rawContours = flattenPath(commands, toleranceMm);

  return normalizeWinding(rawContours);
};

// Glyph outlines in the pipeline's y-up space. Run normalizeWinding after this, never before
// (see flipContoursY).
export const flipGlyphContoursToYUp = (contours: Vec2[][]): Vec2[][] => {
  return normalizeWinding(flipContoursY(contours));
};
