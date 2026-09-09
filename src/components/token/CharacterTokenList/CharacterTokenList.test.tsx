// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { characterTokenId } from "../../../core/token/catalog/buildTokenItems";
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
    {
      id: "spigot",
      name: "Spigot",
      tokens: [{ title: "Singled Out", maxCopies: 2 }],
    },
  ],
  genericTokens: [],
};

const renderList = (
  overrides: Partial<{
    selectedTokenIds: string[];
    tokenCopies: Record<string, number>;
    onSelectedTokenIdsChange: (ids: string[]) => void;
    onTokenCopiesChange: (copies: Record<string, number>) => void;
  }> = {},
) => {
  const onSelectedTokenIdsChange = overrides.onSelectedTokenIdsChange ?? vi.fn();
  const onTokenCopiesChange = overrides.onTokenCopiesChange ?? vi.fn();

  render(
    <CharacterTokenList
      catalog={catalog}
      selectedTokenIds={overrides.selectedTokenIds ?? []}
      onSelectedTokenIdsChange={onSelectedTokenIdsChange}
      tokenCopies={overrides.tokenCopies ?? {}}
      onTokenCopiesChange={onTokenCopiesChange}
    />,
  );

  return { onSelectedTokenIdsChange, onTokenCopiesChange };
};

describe("CharacterTokenList", () => {
  it("adds a token id to the selection when its checkbox is checked", async () => {
    const { onSelectedTokenIdsChange } = renderList();

    await userEvent.click(screen.getByLabelText("Commanding Aura"));

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([characterTokenId("tapper", 0)]);
  });

  it("removes a token id from the selection when its checkbox is unchecked", async () => {
    const selectedTokenIds = [characterTokenId("tapper", 0), characterTokenId("tapper", 1)];
    const { onSelectedTokenIdsChange } = renderList({ selectedTokenIds });

    await userEvent.click(screen.getByLabelText("Marked Target"));

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([characterTokenId("tapper", 0)]);
  });

  it("selects every token of a character when its header checkbox is checked", async () => {
    const { onSelectedTokenIdsChange } = renderList();

    await userEvent.click(screen.getByLabelText("Tapper"));

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([
      characterTokenId("tapper", 0),
      characterTokenId("tapper", 1),
    ]);
  });

  it("deselects every token of a character when its header checkbox is unchecked", async () => {
    const selectedTokenIds = [characterTokenId("tapper", 0), characterTokenId("tapper", 1)];
    const { onSelectedTokenIdsChange } = renderList({ selectedTokenIds });

    expect(screen.getByLabelText("Tapper")).toBeChecked();

    await userEvent.click(screen.getByLabelText("Tapper"));

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([]);
  });

  it("selects every character's tokens when the guild-wide select-all checkbox is checked", async () => {
    const { onSelectedTokenIdsChange } = renderList();

    await userEvent.click(screen.getByLabelText("Select all"));

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([
      characterTokenId("tapper", 0),
      characterTokenId("tapper", 1),
      characterTokenId("spigot", 0),
    ]);
  });

  it("disables the header checkbox for a character with no tokens", () => {
    renderList();

    expect(screen.getByLabelText("Keg")).toBeDisabled();
    expect(screen.getByText("No tokens")).toBeInTheDocument();
  });

  it("shows a selected/total count badge for a character with tokens", () => {
    renderList({ selectedTokenIds: [characterTokenId("tapper", 0)] });

    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("shows a copies field for a token with maxCopies greater than 1, disabled until selected", () => {
    renderList();

    const copiesField = screen.getByLabelText("Singled Out copies");

    expect(copiesField).toBeDisabled();
    expect(copiesField).toHaveValue(1);
  });

  it("enables the copies field once its token is selected, keeping the previously chosen count", async () => {
    const { onSelectedTokenIdsChange } = renderList({
      selectedTokenIds: [],
      tokenCopies: { [characterTokenId("spigot", 0)]: 2 },
    });

    const copiesField = screen.getByLabelText("Singled Out copies");

    expect(copiesField).toBeDisabled();
    expect(copiesField).toHaveValue(2);

    await userEvent.click(screen.getByLabelText("Singled Out"));

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([characterTokenId("spigot", 0)]);
  });

  it("updates the copies count without touching the selection", async () => {
    const { onTokenCopiesChange, onSelectedTokenIdsChange } = renderList({
      selectedTokenIds: [characterTokenId("spigot", 0)],
    });

    const copiesField = screen.getByLabelText("Singled Out copies");

    fireEvent.change(copiesField, { target: { value: "2" } });

    expect(onTokenCopiesChange).toHaveBeenCalledWith({ [characterTokenId("spigot", 0)]: 2 });
    expect(onSelectedTokenIdsChange).not.toHaveBeenCalled();
  });

  it("does not show a copies field for a token without maxCopies", () => {
    renderList();

    expect(screen.queryByLabelText("Commanding Aura copies")).not.toBeInTheDocument();
  });
});
