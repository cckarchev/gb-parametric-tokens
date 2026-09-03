export type PathCommand =
  | { type: "move"; x: number; y: number }
  | { type: "line"; x: number; y: number }
  | { type: "cubic"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: "quad"; x1: number; y1: number; x: number; y: number }
  | { type: "close" };

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

export const parsePathData = (d: string): PathCommand[] => {
  const commands: PathCommand[] = [];

  let currentX = 0;
  let currentY = 0;
  let subpathStartX = 0;
  let subpathStartY = 0;
  let lastCubicControlX: number | null = null;
  let lastCubicControlY: number | null = null;

  for (const match of d.matchAll(COMMAND_LETTER_PATTERN)) {
    const letter = match[1];
    const upperLetter = letter.toUpperCase();
    const isRelative = letter !== upperLetter;

    if (upperLetter === "Z") {
      commands.push({ type: "close" });
      currentX = subpathStartX;
      currentY = subpathStartY;
      lastCubicControlX = null;
      lastCubicControlY = null;
      continue;
    }

    const argCount = ARG_COUNT_BY_COMMAND[upperLetter];
    const numbers = (match[2].match(NUMBER_PATTERN) ?? []).map(Number);
    let isFirstPairOfMove = upperLetter === "M";

    for (let i = 0; i + argCount <= numbers.length; i += argCount) {
      const offsetX = isRelative ? currentX : 0;
      const offsetY = isRelative ? currentY : 0;

      if (upperLetter === "M") {
        const x = numbers[i] + offsetX;
        const y = numbers[i + 1] + offsetY;

        commands.push({ type: isFirstPairOfMove ? "move" : "line", x, y });

        currentX = x;
        currentY = y;
        lastCubicControlX = null;
        lastCubicControlY = null;

        if (isFirstPairOfMove) {
          subpathStartX = x;
          subpathStartY = y;
        }

        isFirstPairOfMove = false;
      } else if (upperLetter === "L") {
        const x = numbers[i] + offsetX;
        const y = numbers[i + 1] + offsetY;

        commands.push({ type: "line", x, y });

        currentX = x;
        currentY = y;
        lastCubicControlX = null;
        lastCubicControlY = null;
      } else if (upperLetter === "H") {
        const x = numbers[i] + offsetX;

        commands.push({ type: "line", x, y: currentY });

        currentX = x;
        lastCubicControlX = null;
        lastCubicControlY = null;
      } else if (upperLetter === "V") {
        const y = numbers[i] + offsetY;

        commands.push({ type: "line", x: currentX, y });

        currentY = y;
        lastCubicControlX = null;
        lastCubicControlY = null;
      } else if (upperLetter === "C") {
        const x1 = numbers[i] + offsetX;
        const y1 = numbers[i + 1] + offsetY;
        const x2 = numbers[i + 2] + offsetX;
        const y2 = numbers[i + 3] + offsetY;
        const x = numbers[i + 4] + offsetX;
        const y = numbers[i + 5] + offsetY;

        commands.push({ type: "cubic", x1, y1, x2, y2, x, y });

        currentX = x;
        currentY = y;
        lastCubicControlX = x2;
        lastCubicControlY = y2;
      } else if (upperLetter === "S") {
        const x2 = numbers[i] + offsetX;
        const y2 = numbers[i + 1] + offsetY;
        const x = numbers[i + 2] + offsetX;
        const y = numbers[i + 3] + offsetY;
        const x1 = lastCubicControlX === null ? currentX : 2 * currentX - lastCubicControlX;
        const y1 = lastCubicControlY === null ? currentY : 2 * currentY - lastCubicControlY;

        commands.push({ type: "cubic", x1, y1, x2, y2, x, y });

        currentX = x;
        currentY = y;
        lastCubicControlX = x2;
        lastCubicControlY = y2;
      }
    }
  }

  return commands;
};
