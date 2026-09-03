import { contourToPathSegment } from "../export/svgDocument";
import { computeBounds } from "../geometry/computeBounds";
import { BASE_COLOR_GROUP_ID, resolveColorGroupDisplay } from "../mesh/colorGroups";
import { groupReliefComponentsByColorGroup } from "../mesh/groupReliefComponents";
import { ReliefComponent } from "../mesh/reliefComponent";
import { ColorGroupSpec, ShapeSpec, Vec2 } from "../types";
import {
  buildBaseReferenceCircleSvg,
  CIRCLE_ANCHOR_X_SVG,
  CIRCLE_ANCHOR_Y_SVG,
  computeBaseReferenceCircleBottomYSvg,
} from "./svgBaseReference";
import { buildGridOverlaySvg, SvgBounds } from "./svgGrid";

const DEFAULT_PADDING_MM = 5;

export type PreviewSvg = { svg: string; viewBox: SvgBounds };

// Preview contours arrive in the core pipeline's mathYUp world convention (same as the 3D
// mesh, see arcPlacement.ts). SVG's y axis points down, so rendering those coordinates
// unmodified mirrors the token top-to-bottom. Negate y at this exact boundary, the same
// place layoutArcText.ts's flipYAndNormalize and arcPlacement.ts's "svgYDown" branch do it.
const flipY = (contours: Vec2[][]): Vec2[][] => {
  return contours.map((contour) => contour.map(([x, y]): Vec2 => [x, -y]));
};

const flipComponents = (components: ReliefComponent[]): ReliefComponent[] => {
  return components.map((component) => ({ ...component, contours: flipY(component.contours) }));
};

const shift = (contours: Vec2[][], dx: number, dy: number): Vec2[][] => {
  return contours.map((contour) => contour.map(([x, y]): Vec2 => [x + dx, y + dy]));
};

const shiftComponents = (
  components: ReliefComponent[],
  dx: number,
  dy: number,
): ReliefComponent[] => {
  return components.map((component) => ({
    ...component,
    contours: shift(component.contours, dx, dy),
  }));
};

export const buildPreviewSvg = (
  baseContours: Vec2[][],
  reliefComponents: ReliefComponent[],
  colorGroups: ColorGroupSpec[],
  shape?: ShapeSpec,
): PreviewSvg => {
  const flippedBaseContours = flipY(baseContours);
  const flippedReliefComponents = flipComponents(reliefComponents);

  // The reference circle's position is a fixed, constant anchor (see svgBaseReference.ts) --
  // the arc token's own local origin is drawn there directly, never computed from the token's
  // rendered content, so changing any shape parameter never moves the circle relative to the
  // token.
  const tokenShiftXSvg = shape?.type === "arc" ? CIRCLE_ANCHOR_X_SVG : 0;
  const tokenShiftYSvg = shape?.type === "arc" ? CIRCLE_ANCHOR_Y_SVG : 0;

  const shiftedBaseContours = shift(flippedBaseContours, tokenShiftXSvg, tokenShiftYSvg);
  const shiftedReliefComponents = shiftComponents(
    flippedReliefComponents,
    tokenShiftXSvg,
    tokenShiftYSvg,
  );
  const reliefContoursByColorGroup = groupReliefComponentsByColorGroup(shiftedReliefComponents);

  const bounds = computeBounds(
    [shiftedBaseContours, ...shiftedReliefComponents.map((component) => component.contours)].flat(),
  );

  const bottomBoundMm =
    shape?.type === "arc"
      ? Math.max(bounds.max[1], computeBaseReferenceCircleBottomYSvg(CIRCLE_ANCHOR_Y_SVG))
      : bounds.max[1];

  const viewBox: SvgBounds = {
    x: bounds.min[0] - DEFAULT_PADDING_MM,
    y: bounds.min[1] - DEFAULT_PADDING_MM,
    width: bounds.max[0] - bounds.min[0] + DEFAULT_PADDING_MM * 2,
    height: bottomBoundMm - bounds.min[1] + DEFAULT_PADDING_MM * 2,
  };

  const baseColor = resolveColorGroupDisplay(BASE_COLOR_GROUP_ID, colorGroups).color;
  const basePathData = shiftedBaseContours.map(contourToPathSegment).join(" ");
  const paths = [`<path d="${basePathData}" fill="${baseColor}" fill-rule="evenodd" />`];

  for (const [colorGroupId, contours] of reliefContoursByColorGroup) {
    const color = resolveColorGroupDisplay(colorGroupId, colorGroups).color;
    const pathData = contours.map(contourToPathSegment).join(" ");

    paths.push(`<path d="${pathData}" fill="${color}" fill-rule="evenodd" />`);
  }

  const baseReferenceCircleSvg =
    shape?.type === "arc"
      ? buildBaseReferenceCircleSvg(CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG)
      : "";

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}">`,
    buildGridOverlaySvg(viewBox),
    baseReferenceCircleSvg,
    ...paths,
    "</svg>",
  ].join("\n");

  return { svg, viewBox };
};
