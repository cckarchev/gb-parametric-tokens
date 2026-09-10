import { describe, expect, it } from "vitest";

import { resolveEffect } from "./effects";

describe("resolveEffect", () => {
  it("resolves a known effect from the bundled catalog", () => {
    expect(resolveEffect("Acrobatic")).toEqual({ name: "Acrobatic" });
  });

  it("throws for an unknown effect name", () => {
    expect(() => resolveEffect("Not A Real Effect")).toThrow('Unknown effect "Not A Real Effect"');
  });
});
