// How finely each kind of curve is split into straight segments. Every module
// that builds the same kind of curve reads it from here, so they can't drift
// apart.

// Smooth body outlines: a disc token's own circle, the ribbon's inner and outer
// curves, a decoration ring, and the preview's rendering of all of those. High
// enough that a token's edge reads as a true circle at print scale rather than
// a visible polygon.
export const BODY_CIRCLE_SEGMENTS = 128;

// The physical stud circle on an arc token, and any cut made against it (see
// geometry/trimIconToCircle.ts): a trimmed icon's edge shouldn't read as any
// more or less faceted than the stud it was cut to, so both use this one value.
export const STUD_CIRCLE_SEGMENTS = 48;

// Round joins on a CrossSection.offset(): the fillet's dilate/erode pair, the
// "grow" icon dilation, and the min-stroke-width erosion. An offset only ever
// rounds off a corner, never forms a whole visible circle, so it needs far
// fewer segments than a body outline does.
export const OFFSET_ARC_SEGMENTS = 32;

// Passed only to reach offset()'s next argument. Every offset here uses round
// joins, so it has no effect; 2 is Clipper2's default.
export const OFFSET_MITER_LIMIT = 2;
