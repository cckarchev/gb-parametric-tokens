import { describe, expect, it } from "vitest";

import { guildIdFromPathname, guildPathname } from "./guildRoute";
import { GENERIC_CATALOG_ID } from "./token/catalog/genericCatalog";

describe("guildPathname", () => {
  it("builds the guild route from a guild id", () => {
    expect(guildPathname("brewers")).toBe("/guild/brewers");
  });

  it("gives the generic catalog its own top-level route, since it is not a guild", () => {
    expect(guildPathname(GENERIC_CATALOG_ID)).toBe("/generic");
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

  it("reads the generic catalog id from its own route", () => {
    expect(guildIdFromPathname("/generic")).toBe(GENERIC_CATALOG_ID);
    expect(guildIdFromPathname("/generic/")).toBe(GENERIC_CATALOG_ID);
  });

  it("does not treat the generic catalog as a guild under the guild route", () => {
    expect(guildIdFromPathname("/guild/generic")).toBeUndefined();
  });

  it("round-trips the generic catalog with guildPathname", () => {
    expect(guildIdFromPathname(guildPathname(GENERIC_CATALOG_ID))).toBe(GENERIC_CATALOG_ID);
  });

  it("round-trips with guildPathname", () => {
    expect(guildIdFromPathname(guildPathname("lamplighters"))).toBe("lamplighters");
  });
});
