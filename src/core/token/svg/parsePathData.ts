export type PathCommand =
  | { type: "move"; x: number; y: number }
  | { type: "line"; x: number; y: number }
  | {
      type: "cubic";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      x: number;
      y: number;
    }
  | { type: "quad"; x1: number; y1: number; x: number; y: number }
  | { type: "close" };

type Point = { x: number; y: number };

// Where the pen is while the path is read. lastCubicControl is the previous
// segment's second control point, which an S segment reflects, or null when
// that segment was not a cubic.
type PathCursor = {
  current: Point;
  subpathStart: Point;
  lastCubicControl: Point | null;
};

type SegmentParser = (
  args: number[],
  offset: Point,
  cursor: PathCursor,
) => PathCommand;

const ARG_COUNT_BY_COMMAND: Record<string, number> = {
  M: 2,
  L: 2,
  C: 6,
  H: 1,
  V: 1,
  S: 4,
};

const COMMAND_LETTER_PATTERN = /([MLCZHVSmlczhvs])([^MLCZHVSmlczhvs]*)/g;
const NUMBER_PATTERN = /-?\d*\.\d+(?:[eE][-+]?\d+)?|-?\d+(?:[eE][-+]?\d+)?/g;

const ORIGIN: Point = { x: 0, y: 0 };
const COORDS_PER_POINT = 2;

// The pairIndex-th x,y pair among a segment's arguments, shifted by offset.
const pointAt = (args: number[], pairIndex: number, offset: Point): Point => {
  const xIndex = pairIndex * COORDS_PER_POINT;

  return {
    x: args[xIndex] + offset.x,
    y: args[xIndex + 1] + offset.y,
  };
};

const moveTo = (cursor: PathCursor, point: Point): PathCommand => {
  cursor.current = point;
  cursor.subpathStart = point;
  cursor.lastCubicControl = null;

  return { type: "move", x: point.x, y: point.y };
};

const lineTo = (cursor: PathCursor, point: Point): PathCommand => {
  cursor.current = point;
  cursor.lastCubicControl = null;

  return { type: "line", x: point.x, y: point.y };
};

const cubicTo = (
  cursor: PathCursor,
  control1: Point,
  control2: Point,
  end: Point,
): PathCommand => {
  cursor.current = end;
  cursor.lastCubicControl = control2;

  return {
    type: "cubic",
    x1: control1.x,
    y1: control1.y,
    x2: control2.x,
    y2: control2.y,
    x: end.x,
    y: end.y,
  };
};

const closePath = (cursor: PathCursor): PathCommand => {
  cursor.current = cursor.subpathStart;
  cursor.lastCubicControl = null;

  return { type: "close" };
};

// An S segment's first control point mirrors the previous cubic's second one
// through the current point, or sits on the current point when the previous
// segment was not a cubic.
const reflectedControl = (cursor: PathCursor): Point => {
  const { current, lastCubicControl } = cursor;

  if (lastCubicControl === null) {
    return current;
  }

  return {
    x: 2 * current.x - lastCubicControl.x,
    y: 2 * current.y - lastCubicControl.y,
  };
};

const SEGMENT_PARSERS: Record<string, SegmentParser> = {
  M: (args, offset, cursor) => moveTo(cursor, pointAt(args, 0, offset)),
  L: (args, offset, cursor) => lineTo(cursor, pointAt(args, 0, offset)),
  H: (args, offset, cursor) =>
    lineTo(cursor, { x: args[0] + offset.x, y: cursor.current.y }),
  V: (args, offset, cursor) =>
    lineTo(cursor, { x: cursor.current.x, y: args[0] + offset.y }),
  C: (args, offset, cursor) =>
    cubicTo(
      cursor,
      pointAt(args, 0, offset),
      pointAt(args, 1, offset),
      pointAt(args, 2, offset),
    ),
  S: (args, offset, cursor) =>
    cubicTo(
      cursor,
      reflectedControl(cursor),
      pointAt(args, 0, offset),
      pointAt(args, 1, offset),
    ),
};

// Every segment one command letter carries. Pairs after a move's first one are
// implicit lines.
const commandSegments = (
  letter: string,
  argText: string,
  cursor: PathCursor,
): PathCommand[] => {
  const upperLetter = letter.toUpperCase();

  if (upperLetter === "Z") {
    return [closePath(cursor)];
  }

  const isRelative = letter !== upperLetter;
  const argCount = ARG_COUNT_BY_COMMAND[upperLetter];
  const numbers = (argText.match(NUMBER_PATTERN) ?? []).map(Number);
  const segments: PathCommand[] = [];

  for (let i = 0; i + argCount <= numbers.length; i += argCount) {
    const args = numbers.slice(i, i + argCount);
    const offset = isRelative ? cursor.current : ORIGIN;
    const isImplicitLine = upperLetter === "M" && i > 0;
    const segmentLetter = isImplicitLine ? "L" : upperLetter;

    segments.push(SEGMENT_PARSERS[segmentLetter](args, offset, cursor));
  }

  return segments;
};

export const parsePathData = (d: string): PathCommand[] => {
  const cursor: PathCursor = {
    current: ORIGIN,
    subpathStart: ORIGIN,
    lastCubicControl: null,
  };

  return [...d.matchAll(COMMAND_LETTER_PATTERN)].flatMap((match) =>
    commandSegments(match[1], match[2], cursor),
  );
};
