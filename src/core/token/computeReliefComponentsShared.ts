import { placeIcon, rotateContours, translateContours } from "./geometry/iconPlacement";
import { computeRingContour } from "./geometry/ringContour";
import { ReliefComponent } from "./mesh/reliefComponent";
import { extractPathData } from "./svg/extractPathData";
import { flattenPath } from "./svg/flattenPath";
import { normalizeWinding } from "./svg/normalizeWinding";
import { parsePathData } from "./svg/parsePathData";
import { IconSpec, PrintProfile, TokenSpec, Vec2 } from "./types";

export type LoadIconSourceResult = { svgSource: string; resolvedId: string; substituted: boolean };
export type LoadIconSource = (iconId: string) => Promise<LoadIconSourceResult>;

export const buildIconComponent = async (
  icon: IconSpec,
  targetDiameterMm: number,
  center: Vec2,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
  warnings: string[],
  rotationDeg = 0,
): Promise<ReliefComponent> => {
  const { svgSource, resolvedId, substituted } = await loadIconSource(icon.iconId);

  if (substituted) {
    warnings.push(`Icon "${icon.iconId}" not found, using fallback "${resolvedId}".`);
  }

  const pathDataList = extractPathData(svgSource);
  const rawContours = pathDataList.flatMap((d) =>
    flattenPath(parsePathData(d), printProfile.bezierToleranceMm),
  );
  const placed = placeIcon(rawContours, { targetDiameterMm, scale: icon.scale });

  // placeIcon flips Y; normalizeWinding must run after, same trap M1/M4 scripts document.
  const normalized = normalizeWinding(placed);
  // Rotate about the icon's own center (still at the origin here) before translating it out
  // to its final position, the same rotate-then-translate order applyArcPlacement uses for
  // glyphs.
  const rotated = rotateContours(normalized, rotationDeg);
  const contours = translateContours(rotated, center);

  return { contours, colorGroup: icon.colorGroup };
};

// Shared by every disc-shaped layout (flat and ring alike): both center their icons at the
// disc's own center, distinguished only by which side("center") icons are present.
export const buildCenterIconComponents = (
  icons: IconSpec[],
  targetDiameterMm: number,
  printProfile: PrintProfile,
  loadIconSource: LoadIconSource,
  warnings: string[],
): Promise<ReliefComponent[]> => {
  const centerIcons = icons.filter((icon) => icon.side === "center");

  return Promise.all(
    centerIcons.map((icon) =>
      buildIconComponent(icon, targetDiameterMm, [0, 0], printProfile, loadIconSource, warnings),
    ),
  );
};

// Shared by every disc-shaped layout (flat and ring alike): a decoration is a standalone
// relief feature, not tied to text or icon placement, so it never depends on which layout
// produced the rest of the token's contours.
export const buildDecorationComponents = (
  decorations: TokenSpec["decorations"],
): ReliefComponent[] => {
  return decorations
    .filter((decoration) => decoration.type === "ring")
    .map((decoration) => ({
      contours: computeRingContour(decoration.radiusMm, decoration.widthMm),
      colorGroup: decoration.colorGroup,
    }));
};
