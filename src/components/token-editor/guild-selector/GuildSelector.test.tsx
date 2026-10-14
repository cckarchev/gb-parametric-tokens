// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GENERIC_CATALOG_ID } from "@/core/token/catalog/genericCatalog";

import { GuildSelector } from "./GuildSelector";

const brewers = { id: "brewers", name: "Brewers", color: "#cdb320" };
const morticians = { id: "morticians", name: "Morticians", color: "#1d2022" };
const generic = { id: GENERIC_CATALOG_ID, name: "Generic", color: "#4a4a4a" };

describe("GuildSelector", () => {
  it("renders each guild as a tile and reports the selection when clicked", async () => {
    const onSelect = vi.fn();

    render(<GuildSelector guilds={[brewers, morticians]} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Morticians" }));

    expect(onSelect).toHaveBeenCalledWith("morticians");
  });

  it("keeps the generic catalog out of the guild grid, in its own group below it", async () => {
    const onSelect = vi.fn();

    render(<GuildSelector guilds={[brewers, generic]} onSelect={onSelect} />);

    const guildGrid = screen.getByRole("group", { name: "Guilds" });
    const genericGroup = screen.getByRole("group", { name: "Not tied to a guild" });

    expect(guildGrid).not.toContainElement(screen.getByRole("button", { name: "Generic" }));
    expect(genericGroup).toContainElement(screen.getByRole("button", { name: "Generic" }));

    await userEvent.click(screen.getByRole("button", { name: "Generic" }));

    expect(onSelect).toHaveBeenCalledWith(GENERIC_CATALOG_ID);
  });

  it("leaves out the generic group when the list has no generic catalog", () => {
    render(<GuildSelector guilds={[brewers]} onSelect={vi.fn()} />);

    expect(screen.queryByRole("group", { name: "Not tied to a guild" })).not.toBeInTheDocument();
  });

  it("paints each guild's icon with its own color", () => {
    render(<GuildSelector guilds={[brewers]} onSelect={vi.fn()} />);

    expect(screen.getByRole("img", { name: "Brewers" })).toHaveStyle({
      backgroundColor: "#cdb320",
    });
  });

  it("shows the guild name as a tooltip, not a permanent label", () => {
    render(<GuildSelector guilds={[brewers]} onSelect={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Brewers" });

    expect(button).toHaveAttribute("title", "Brewers");
    expect(button.children).toHaveLength(1);
  });
});
