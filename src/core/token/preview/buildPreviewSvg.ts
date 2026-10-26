import { buildTokenPathsSvg } from "../buildTokenPathsSvg";
import { computeBounds } from "../geometry/computeBounds";
import {
  flipContoursY,
  translateContours,
} from "../geometry/contourTransforms";
import { groupReliefComponentsByColorGroup } from "../mesh/groupReliefComponents";
import type { ReliefComponent } from "../mesh/reliefComponent";
import type { ColorGroupSpec, ShapeSpec, Vec2 } from "../types";
import {
  buildBaseReferenceCircleSvg,
  CIRCLE_ANCHOR_X_SVG,
  CIRCLE_ANCHOR_Y_SVG,
  computeBaseReferenceCircleBottomYSvg,
} from "./svgBaseReference";
import {
  buildGridOverlaySvg,
  type RenderedSvg,
  type SvgBounds,
} from "./svgGrid";

const DEFAULT_PADDING_MM = 5;

// The pipeline is y-up and SVG is y-down, so the preview flips every contour on
// the way in.
const flipComponents = (components: ReliefComponent[]): ReliefComponent[] =>
  components.map((component) => ({
    ...component,
    contours: flipContoursY(component.contours),
  }));

const shiftComponents = (
  components: ReliefComponent[],
  offset: Vec2,
): ReliefComponent[] =>
  components.map((component) => ({
    ...component,
    contours: translateContours(component.contours, offset),
  }));

export const buildPreviewSvg = (
  baseContours: Vec2[][],
  reliefComponents: ReliefComponent[],
  colorGroups: ColorGroupSpec[],
  shape?: ShapeSpec,
): RenderedSvg => {
  const flippedBaseContours = flipContoursY(baseContours);
  const flippedReliefComponents = flipComponents(reliefComponents);

  // The arc token's origin goes on the circle's fixed anchor (see
  // svgBaseReference.ts).
  const tokenShiftSvg: Vec2 =
    shape?.type === "arc" ? [CIRCLE_ANCHOR_X_SVG, CIRCLE_ANCHOR_Y_SVG] : [0, 0];

  const shiftedBaseContours = translateContours(
    flippedBaseContours,
    tokenShiftSvg,
  );
  const shiftedReliefComponents = shiftComponents(
    flippedReliefComponents,
    tokenShiftSvg,
  );
  const reliefContoursByColorGroup = groupReliefComponentsByColorGroup(
    shiftedReliefComponents,
  );

  const bounds = computeBounds(
    [
      shiftedBaseContours,
      ...shiftedReliefComponents.map((component) => component.contours),
    ].flat(),
  );

  const bottomBoundMm =
    shape?.type === "arc"
      ? Math.max(
          bounds.max[1],
          computeBaseReferenceCircleBottomYSvg(CIRCLE_ANCHOR_Y_SVG),
        )
      : bounds.max[1];

  const viewBox: SvgBounds = {
    x: bounds.min[0] - DEFAULT_PADDING_MM,
    y: bounds.min[1] - DEFAULT_PADDING_MM,
    width: bounds.max[0] - bounds.min[0] + DEFAULT_PADDING_MM * 2,
    height: bottomBoundMm - bounds.min[1] + DEFAULT_PADDING_MM * 2,
  };

  const paths = buildTokenPathsSvg(
    shiftedBaseContours,
    reliefContoursByColorGroup,
    colorGroups,
  );

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
