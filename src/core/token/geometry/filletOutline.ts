import type { CrossSection } from "manifold-3d";

const FILLET_CIRCULAR_SEGMENTS = 32;

// Morphological "closing" -- dilate by filletRadiusMm, then erode back by the same amount, both
// with round joins. Closing only ever adds material, and it does so exactly where a disk of
// filletRadiusMm can't reach into a concave notch (e.g. where an arc token's ribbon meets its
// stud), while an isolated convex boundary (the stud's own circle, the ribbon's outer curve) comes
// back to itself once eroded, since there's no notch there for the disk to get stuck on.
export const filletOutline = (section: CrossSection, filletRadiusMm: number): CrossSection => {
  return section
    .offset(filletRadiusMm, "Round", 2, FILLET_CIRCULAR_SEGMENTS)
    .offset(-filletRadiusMm, "Round", 2, FILLET_CIRCULAR_SEGMENTS);
};
