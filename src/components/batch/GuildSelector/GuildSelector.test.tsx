// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GuildSelector } from "./GuildSelector";

describe("GuildSelector", () => {
  it("lists each guild as an option and reports the selection", async () => {
    const onSelect = vi.fn();
    const guilds = [
      { id: "brewers", name: "Brewers" },
      { id: "morticians", name: "Morticians" },
    ];

    render(<GuildSelector guilds={guilds} selectedGuildId="brewers" onSelect={onSelect} />);

    const select = screen.getByLabelText("Guild");

    expect(select).toHaveValue("brewers");

    await userEvent.selectOptions(select, "morticians");

    expect(onSelect).toHaveBeenCalledWith("morticians");
  });

  it("renders no options when the guild list is empty", () => {
    render(<GuildSelector guilds={[]} onSelect={vi.fn()} />);

    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("shows a placeholder instead of silently defaulting to the first guild when nothing is selected", async () => {
    const onSelect = vi.fn();
    const guilds = [{ id: "brewers", name: "Brewers" }];

    render(<GuildSelector guilds={guilds} onSelect={onSelect} />);

    const select = screen.getByLabelText("Guild") as HTMLSelectElement;

    expect(select.value).toBe("");

    await userEvent.selectOptions(select, "brewers");

    expect(onSelect).toHaveBeenCalledWith("brewers");
  });
});
