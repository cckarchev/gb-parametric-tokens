// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GuildCatalog } from "../../../core/token/catalog/catalogTypes";
import { characterTokenId } from "../../../core/token/catalog/tokenItems/tokenItem";
import { CharacterTokenList } from "./CharacterTokenList";

// A deliberately tiny guild, but every character and effect named here is a real entry in the
// catalog data, so the fixture describes a roster that could actually exist. "Singled Out" is the
// only effect in the whole registry that carries maxCopies, which is what makes it the token this
// file uses to cover the copies field.
const catalog: GuildCatalog = {
  guildId: "brewers",
  name: "Brewers",
  color: "#cdb320",
  characters: [
    {
      name: "Tapper",
      effects: ["commandingAura", "markedTarget"],
    },
    {
      name: "Scum",
      effects: [],
    },
    {
      name: "Spigot",
      effects: ["singledOut"],
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

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([characterTokenId("Tapper", 0)]);
  });

  it("removes a token id from the selection when its checkbox is unchecked", async () => {
    const selectedTokenIds = [characterTokenId("Tapper", 0), characterTokenId("Tapper", 1)];
    const { onSelectedTokenIdsChange } = renderList({ selectedTokenIds });

    await userEvent.click(screen.getByLabelText("Marked Target"));

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([characterTokenId("Tapper", 0)]);
  });

  it("selects every token of a character when its header checkbox is checked", async () => {
    const { onSelectedTokenIdsChange } = renderList();

    await userEvent.click(screen.getByLabelText("Tapper"));

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([
      characterTokenId("Tapper", 0),
      characterTokenId("Tapper", 1),
    ]);
  });

  it("deselects every token of a character when its header checkbox is unchecked", async () => {
    const selectedTokenIds = [characterTokenId("Tapper", 0), characterTokenId("Tapper", 1)];
    const { onSelectedTokenIdsChange } = renderList({ selectedTokenIds });

    expect(screen.getByLabelText("Tapper")).toBeChecked();

    await userEvent.click(screen.getByLabelText("Tapper"));

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([]);
  });

  it("selects every character's tokens when the guild-wide select-all checkbox is checked", async () => {
    const { onSelectedTokenIdsChange } = renderList();

    await userEvent.click(screen.getByLabelText("Select all"));

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([
      characterTokenId("Tapper", 0),
      characterTokenId("Tapper", 1),
      characterTokenId("Spigot", 0),
    ]);
  });

  it("disables the header checkbox for a character with no tokens", () => {
    renderList();

    expect(screen.getByLabelText("Scum")).toBeDisabled();
    expect(screen.getByText("No tokens")).toBeInTheDocument();
  });

  it("shows a selected/total count badge for a character with tokens", () => {
    renderList({ selectedTokenIds: [characterTokenId("Tapper", 0)] });

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
      tokenCopies: { [characterTokenId("Spigot", 0)]: 2 },
    });

    const copiesField = screen.getByLabelText("Singled Out copies");

    expect(copiesField).toBeDisabled();
    expect(copiesField).toHaveValue(2);

    await userEvent.click(screen.getByLabelText("Singled Out"));

    expect(onSelectedTokenIdsChange).toHaveBeenCalledWith([characterTokenId("Spigot", 0)]);
  });

  it("updates the copies count without touching the selection", async () => {
    const { onTokenCopiesChange, onSelectedTokenIdsChange } = renderList({
      selectedTokenIds: [characterTokenId("Spigot", 0)],
    });

    const copiesField = screen.getByLabelText("Singled Out copies");

    fireEvent.change(copiesField, { target: { value: "2" } });

    expect(onTokenCopiesChange).toHaveBeenCalledWith({ [characterTokenId("Spigot", 0)]: 2 });
    expect(onSelectedTokenIdsChange).not.toHaveBeenCalled();
  });

  it("does not show a copies field for a token without maxCopies", () => {
    renderList();

    expect(screen.queryByLabelText("Commanding Aura copies")).not.toBeInTheDocument();
  });

  it("labels a character's tokens that share a name with their effect text", () => {
    const masonsCatalog: GuildCatalog = {
      guildId: "masons",
      name: "Masons",
      color: "#416abb",
      characters: [{ name: "Hammer", effects: ["hammerTimeDmg", "hammerTimeMov"] }],
      genericTokens: [],
    };

    render(
      <CharacterTokenList
        catalog={masonsCatalog}
        selectedTokenIds={[]}
        onSelectedTokenIdsChange={vi.fn()}
        tokenCopies={{}}
        onTokenCopiesChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Hammer Time! (+1 DMG)")).toBeInTheDocument();
    expect(screen.getByLabelText('Hammer Time! (+2"/+2" MOV)')).toBeInTheDocument();
  });
});
