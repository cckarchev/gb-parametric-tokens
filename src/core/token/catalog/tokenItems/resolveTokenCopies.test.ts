import { describe, expect, it } from "vitest";

import { resolveTokenCopies } from "./resolveTokenCopies";

describe("resolveTokenCopies", () => {
  it("prints a single copy of a token capped at one", () => {
    expect(resolveTokenCopies(undefined, 1)).toBe(1);
  });

  it("starts an untouched repeatable token at two copies", () => {
    expect(resolveTokenCopies(undefined, 6)).toBe(2);
  });

  it("keeps the count the user picked", () => {
    expect(resolveTokenCopies(5, 6)).toBe(5);
  });

  it("clamps a remembered count that is now above the cap", () => {
    expect(resolveTokenCopies(4, 3)).toBe(3);
  });
});
