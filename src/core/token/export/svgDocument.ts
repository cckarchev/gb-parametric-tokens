import { BASE_COLOR_GROUP_ID, resolveColorGroupDisplay } from "../mesh/colorGroups";
import { ColorGroupSpec, Vec2 } from "../types";

const contourToPathSegment = (contour: Vec2[]): string => {
  const [first, ...rest] = contour;
  const moveTo = `M${first[0]},${first[1]}`;
  const lineTos = rest.map(([x, y]) => `L${x},${y}`).join(" ");

  return `${moveTo} ${lineTos} Z`;
};

// Every contour set in this app is a set of outlines with holes inside them (a glyph counter, a
// ring decoration), so the nonzero default would fill those holes in.
const FILL_RULE = "evenodd";

const contoursToPathSvg = (contours: Vec2[][], color: string): string => {
  const pathData = contours.map(contourToPathSegment).join(" ");

  return `<path d="${pathData}" fill="${color}" fill-rule="${FILL_RULE}" />`;
};

// How a token is painted: the base first, then one path per color group over it. Shared by the
// live preview and the contact sheet, which draw the same token in two different surroundings and
// used to each decide this for themselves.
//
// Contours must already sit where they are meant to be drawn. Positioning stays the caller's job
// because the two callers place a token very differently: the preview shifts the whole token once,
// the contact sheet shifts each item into its own cell.
export const buildTokenPathsSvg = (
  baseContours: Vec2[][],
  reliefContoursByColorGroup: Map<string, Vec2[][]>,
  colorGroups: ColorGroupSpec[],
): string[] => {
  const baseColor = resolveColorGroupDisplay(BASE_COLOR_GROUP_ID, colorGroups).color;
  const paths = [contoursToPathSvg(baseContours, baseColor)];

  for (const [colorGroupId, contours] of reliefContoursByColorGroup) {
    const color = resolveColorGroupDisplay(colorGroupId, colorGroups).color;

    paths.push(contoursToPathSvg(contours, color));
  }

  return paths;
};
