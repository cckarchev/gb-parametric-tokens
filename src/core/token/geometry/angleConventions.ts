// Angle where a token's front-facing content is centered, shared by mesh building, preview
// rendering, and the token worker so they all agree on which side is "up".
export const CENTER_ANGLE_DEG = 90;

const HALF_TURN_DEG = 180;

export const DEGREES_PER_RADIAN = HALF_TURN_DEG / Math.PI;

// A point's polar angle says which way "away from the center" points there; a glyph or an icon
// sitting at that point is upright when its own local +y axis points that same way. The two
// differ by exactly a quarter turn, so this is what converts one into the other: subtract it to
// aim the ascender outward, add it to aim it inward (see text/arcPlacement.ts's ArcOrientation).
export const RADIAL_TO_UPRIGHT_OFFSET_DEG = 90;
