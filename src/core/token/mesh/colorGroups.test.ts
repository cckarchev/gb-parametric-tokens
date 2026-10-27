import { describe, expect, it } from "vitest";

import type { ColorGroupSpec } from "../types";
import {
  BASE_COLOR_GROUP_ID,
  resolveColorGroupDisplay,
  resolveColorGroupId,
} from "./colorGroups";

describe("resolveColorGroupId", () => {
  it("returns the reserved base id when no colorGroup is given", () => {
    expect(resolveColorGroupId(undefined)).toBe(BASE_COLOR_GROUP_ID);
  });

  it("returns the given colorGroup unchanged when present", () => {
    expect(resolveColorGroupId("accent")).toBe("accent");
  });
});

describe("resolveColorGroupDisplay", () => {
  const colorGroups: ColorGroupSpec[] = [
    { id: "base", name: "Base", color: "#2B2B2B" },
    { id: "accent", name: "Accent", color: "#C9A13B" },
  ];

  it("finds the matching colorGroup's name and color", () => {
    expect(resolveColorGroupDisplay("accent", colorGroups)).toEqual({
      name: "Accent",
      color: "#C9A13B",
    });
  });

  it("falls back to the id itself and a default gray when no match exists", () => {
    expect(resolveColorGroupDisplay("missing", colorGroups)).toEqual({
      name: "missing",
      color: "#CCCCCC",
    });
  });
});
