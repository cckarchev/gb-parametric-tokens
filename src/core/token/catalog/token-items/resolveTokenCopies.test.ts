import { describe, expect, it } from "vitest";

import { resolveTokenCopies } from "./resolveTokenCopies";

const REPEATABLE_MAX_COPIES = 6;

describe("resolveTokenCopies", () => {
  it("prints a single copy of a token capped at one", () => {
    expect(resolveTokenCopies(undefined, 1)).toBe(1);
  });

  it("starts an untouched repeatable token at two copies", () => {
    expect(resolveTokenCopies(undefined, REPEATABLE_MAX_COPIES)).toBe(2);
  });

  it("keeps the count the user picked", () => {
    const pickedCopies = 5;

    expect(resolveTokenCopies(pickedCopies, REPEATABLE_MAX_COPIES)).toBe(
      pickedCopies,
    );
  });

  it("clamps a remembered count that is now above the cap", () => {
    const rememberedCopies = 4;
    const lowerCap = 3;

    expect(resolveTokenCopies(rememberedCopies, lowerCap)).toBe(lowerCap);
  });
});
