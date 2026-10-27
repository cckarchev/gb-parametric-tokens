import { describe, expect, it } from "vitest";

import { describeError } from "./describeError";

describe("describeError", () => {
  it("uses the message of a real Error", () => {
    expect(describeError(new Error("Font failed to load"))).toBe(
      "Font failed to load",
    );
  });

  it("uses the message of an Error subclass", () => {
    expect(describeError(new TypeError("not a function"))).toBe(
      "not a function",
    );
  });

  it("stringifies a thrown value that is not an Error", () => {
    expect(describeError("plain string")).toBe("plain string");
    const thrownNumber = 42;

    expect(describeError(thrownNumber)).toBe("42");
  });

  it("stringifies undefined and null rather than returning an empty string", () => {
    expect(describeError(undefined)).toBe("undefined");
    expect(describeError(null)).toBe("null");
  });
});
