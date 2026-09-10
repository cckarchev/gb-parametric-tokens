// How finely every curve in this app gets tessellated into straight segments. These used to live
// as a private constant per module, each one carrying a comment saying it had to stay in sync with
// another module's copy ("Matches buildArcTokenMesh.ts's STUD_CIRCULAR_SEGMENTS", "Matches
// validateMinStrokeWidth.ts's own erosion offset call"). That sync contract is what this module
// makes real: change a value here and every surface built at that resolution follows.

// Smooth body outlines: a disc token's own circle, the ribbon's inner and outer curves, a
// decoration ring, and the preview's rendering of all of those. High enough that a token's edge
// reads as a true circle at print scale rather than a visible polygon.
export const BODY_CIRCLE_SEGMENTS = 128;

// The physical stud circle on an arc token, and any cut made against it (see
// geometry/trimIconToCircle.ts): a trimmed icon's edge shouldn't read as any more or less faceted
// than the stud it was cut to, so both use this one value.
export const STUD_CIRCLE_SEGMENTS = 48;

// Round joins on a CrossSection.offset() -- the fillet's dilate/erode pair, the "grow" icon
// dilation, and the min-stroke-width erosion. An offset only ever rounds off a corner, never
// forms a whole visible circle, so it needs far fewer segments than a body outline does.
export const OFFSET_ARC_SEGMENTS = 32;

// The miterLimit argument every CrossSection.offset() call has to pass positionally to reach the
// circularSegments argument after it. Per manifold-3d's own docs it only applies when the join
// type is "Miter", and every offset in this app uses "Round" instead, so it never actually bites:
// 2 is simply Clipper2's default and its minimum allowed value, not a tuned number.
export const OFFSET_MITER_LIMIT = 2;
