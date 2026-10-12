import { describe, expect, it } from "vitest";

import { guildIdFromPathname, guildPathname } from "./guildRoute";

describe("guildPathname", () => {
  it("builds the guild route from a guild id", () => {
    expect(guildPathname("brewers")).toBe("/guild/brewers");
  });
});

describe("guildIdFromPathname", () => {
  it("reads the guild id from a guild route", () => {
    expect(guildIdFromPathname("/guild/brewers")).toBe("brewers");
  });

  it("tolerates a trailing slash", () => {
    expect(guildIdFromPathname("/guild/farmers/")).toBe("farmers");
  });

  it("decodes an encoded guild id", () => {
    expect(guildIdFromPathname("/guild/some%20guild")).toBe("some guild");
  });

  it("returns undefined for a malformed encoded guild id instead of throwing", () => {
    expect(guildIdFromPathname("/guild/%E0")).toBeUndefined();
  });

  it("returns undefined for the root path", () => {
    expect(guildIdFromPathname("/")).toBeUndefined();
  });

  it("returns undefined for a guild route without an id", () => {
    expect(guildIdFromPathname("/guild")).toBeUndefined();
    expect(guildIdFromPathname("/guild/")).toBeUndefined();
  });

  it("returns undefined for unrelated or deeper paths", () => {
    expect(guildIdFromPathname("/settings")).toBeUndefined();
    expect(guildIdFromPathname("/guild/brewers/extra")).toBeUndefined();
  });

  it("round-trips with guildPathname", () => {
    expect(guildIdFromPathname(guildPathname("lamplighters"))).toBe("lamplighters");
  });
});
