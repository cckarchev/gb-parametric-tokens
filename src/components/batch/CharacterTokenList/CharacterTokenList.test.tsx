// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { characterTokenId } from "../../../core/token/catalog/buildBatchItems";
import { GuildCatalog } from "../../../core/token/catalog/catalogTypes";
import { CharacterTokenList } from "./CharacterTokenList";

const catalog: GuildCatalog = {
  guildId: "brewers",
  name: "Brewers",
  color: "#cdb320",
  characters: [
    {
      id: "tapper",
      name: "Tapper",
      tokens: [
        { title: "Commanding Aura", subtitle: '4" Aura +1 TAC +1 DMG' },
        { title: "Marked Target" },
      ],
    },
    {
      id: "keg",
      name: "Keg",
      tokens: [],
    },
  ],
  genericTokens: [],
};

describe("CharacterTokenList", () => {
  it("adds a token id to the selection when its checkbox is checked", async () => {
    const onChange = vi.fn();

    render(<CharacterTokenList catalog={catalog} selectedTokenIds={[]} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Commanding Aura"));

    expect(onChange).toHaveBeenCalledWith([characterTokenId("tapper", 0)]);
  });

  it("removes a token id from the selection when its checkbox is unchecked", async () => {
    const onChange = vi.fn();
    const selectedTokenIds = [characterTokenId("tapper", 0), characterTokenId("tapper", 1)];

    render(
      <CharacterTokenList
        catalog={catalog}
        selectedTokenIds={selectedTokenIds}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByLabelText("Marked Target"));

    expect(onChange).toHaveBeenCalledWith([characterTokenId("tapper", 0)]);
  });

  it("selects every token of a character when its select-all checkbox is checked", async () => {
    const onChange = vi.fn();

    render(<CharacterTokenList catalog={catalog} selectedTokenIds={[]} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Select all: Tapper"));

    expect(onChange).toHaveBeenCalledWith([
      characterTokenId("tapper", 0),
      characterTokenId("tapper", 1),
    ]);
  });

  it("deselects every token of a character when its select-all checkbox is unchecked", async () => {
    const onChange = vi.fn();
    const selectedTokenIds = [characterTokenId("tapper", 0), characterTokenId("tapper", 1)];

    render(
      <CharacterTokenList
        catalog={catalog}
        selectedTokenIds={selectedTokenIds}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText("Select all: Tapper")).toBeChecked();

    await userEvent.click(screen.getByLabelText("Select all: Tapper"));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("selects every character's tokens when the guild-wide select-all checkbox is checked", async () => {
    const onChange = vi.fn();

    render(<CharacterTokenList catalog={catalog} selectedTokenIds={[]} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Select all"));

    expect(onChange).toHaveBeenCalledWith([
      characterTokenId("tapper", 0),
      characterTokenId("tapper", 1),
    ]);
  });

  it("disables the select-all checkbox for a character with no tokens", () => {
    render(<CharacterTokenList catalog={catalog} selectedTokenIds={[]} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Select all: Keg")).toBeDisabled();
    expect(screen.getByText("No tokens")).toBeInTheDocument();
  });
});
