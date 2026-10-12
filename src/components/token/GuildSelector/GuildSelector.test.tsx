// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GuildSelector } from "./GuildSelector";

describe("GuildSelector", () => {
  it("renders each guild as a tile and reports the selection when clicked", async () => {
    const onSelect = vi.fn();
    const guilds = [
      { id: "brewers", name: "Brewers", color: "#cdb320" },
      { id: "morticians", name: "Morticians", color: "#1d2022" },
    ];

    render(<GuildSelector guilds={guilds} selectedGuildId="brewers" onSelect={onSelect} />);

    // A guild is already picked, so the panel starts collapsed; reopen it to reach the tiles.
    await userEvent.click(screen.getByRole("button", { name: "Guild" }));

    expect(screen.getByRole("button", { name: "Brewers" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Morticians" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await userEvent.click(screen.getByRole("button", { name: "Morticians" }));

    expect(onSelect).toHaveBeenCalledWith("morticians");
  });

  it("renders no tiles when the guild list is empty", () => {
    render(<GuildSelector guilds={[]} onSelect={vi.fn()} />);

    expect(screen.queryAllByRole("button", { pressed: false })).toHaveLength(0);
  });

  it("marks every tile unselected when nothing is selected yet", () => {
    const guilds = [{ id: "brewers", name: "Brewers", color: "#cdb320" }];

    render(<GuildSelector guilds={guilds} onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Brewers" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("paints each guild's icon with its own color", () => {
    const guilds = [{ id: "brewers", name: "Brewers", color: "#cdb320" }];

    render(<GuildSelector guilds={guilds} onSelect={vi.fn()} />);

    expect(screen.getByRole("img", { name: "Brewers" })).toHaveStyle({
      backgroundColor: "#cdb320",
    });
  });

  it("shows the guild name as a tooltip, not a permanent label", () => {
    const guilds = [{ id: "brewers", name: "Brewers", color: "#cdb320" }];

    render(<GuildSelector guilds={guilds} onSelect={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Brewers" });

    expect(button).toHaveAttribute("title", "Brewers");
    expect(button.children).toHaveLength(1);
  });

  it("collapses the panel once a guild is selected", async () => {
    const guilds = [{ id: "brewers", name: "Brewers", color: "#cdb320" }];

    render(<GuildSelector guilds={guilds} onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Brewers" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Brewers" }));

    expect(screen.getByRole("button", { name: "Brewers", hidden: true })).not.toBeVisible();
  });

  it("starts collapsed when a guild is already selected, as on a /guild/<id> deep link", () => {
    const guilds = [{ id: "brewers", name: "Brewers", color: "#cdb320" }];

    render(<GuildSelector guilds={guilds} selectedGuildId="brewers" onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Brewers", hidden: true })).not.toBeVisible();
  });

  it("reopens the panel when the selection is cleared, as on going back to the root URL", () => {
    const guilds = [{ id: "brewers", name: "Brewers", color: "#cdb320" }];

    const { rerender } = render(
      <GuildSelector guilds={guilds} selectedGuildId="brewers" onSelect={vi.fn()} />,
    );

    rerender(<GuildSelector guilds={guilds} onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Brewers" })).toBeVisible();
  });
});
