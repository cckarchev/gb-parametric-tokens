import { describe, expect, it } from "vitest";

import { sortRosterNames } from "./sortRosterNames";

describe("sortRosterNames", () => {
  it("sorts names alphabetically", () => {
    expect(sortRosterNames(["Stave", "Flea", "Mash"])).toEqual(["Flea", "Mash", "Stave"]);
  });

  it("places a veteran right after its regular version", () => {
    expect(sortRosterNames(["vSpigot", "Stave", "Spigot", "Flea"])).toEqual([
      "Flea",
      "Spigot",
      "vSpigot",
      "Stave",
    ]);
  });

  it("places a seasoned version right after its regular version", () => {
    expect(sortRosterNames(["sBrisket", "Boar", "Brisket"])).toEqual([
      "Boar",
      "Brisket",
      "sBrisket",
    ]);
  });

  it("sorts a veteran without its regular version by the regular name", () => {
    expect(sortRosterNames(["Hooper", "vDecimate", "Flea"])).toEqual([
      "vDecimate",
      "Flea",
      "Hooper",
    ]);
  });

  it("does not treat a name that merely starts with v or s as a veteran", () => {
    expect(sortRosterNames(["Venin", "Vitriol", "vCalculus", "Snow"])).toEqual([
      "vCalculus",
      "Snow",
      "Venin",
      "Vitriol",
    ]);
  });

  it("does not mutate its input", () => {
    const names = ["Stave", "Flea"];

    sortRosterNames(names);

    expect(names).toEqual(["Stave", "Flea"]);
  });
});
