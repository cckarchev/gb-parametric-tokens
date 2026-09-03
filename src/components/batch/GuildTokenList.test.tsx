// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GuildCatalog } from "../../core/token/catalog/catalogTypes";
import { GuildTokenList } from "./GuildTokenList";

const catalog: GuildCatalog = {
  guildId: "brewers",
  name: "Brewers",
  color: "#cdb320",
  characters: [],
  genericTokens: [{ id: "beer-token", name: "Beer Token" }],
};

const renderList = (overrides: Partial<Parameters<typeof GuildTokenList>[0]> = {}) => {
  return render(
    <GuildTokenList
      catalog={catalog}
      genericCopies={{}}
      onGenericCopiesChange={vi.fn()}
      influenceCopies={0}
      onInfluenceCopiesChange={vi.fn()}
      momentumCopies={0}
      onMomentumCopiesChange={vi.fn()}
      goalInfluenceCopies={0}
      onGoalInfluenceCopiesChange={vi.fn()}
      {...overrides}
    />,
  );
};

describe("GuildTokenList", () => {
  it("shows the influence, momentum, Goal Influence, and generic token fields under a single 'Guild tokens' panel", () => {
    renderList();

    expect(screen.getByText("Guild tokens")).toBeInTheDocument();
    expect(screen.getByLabelText("Influence tokens (0-20)")).toBeInTheDocument();
    expect(screen.getByLabelText("Momentum tokens (0-20)")).toBeInTheDocument();
    expect(screen.getByLabelText("Goal Influence tokens")).toBeInTheDocument();
    expect(screen.getByLabelText("Beer Token")).toBeInTheDocument();
  });

  it("defaults an unlisted generic token's copy count to zero", () => {
    renderList();

    expect(screen.getByLabelText("Beer Token")).toHaveValue(0);
  });

  it("reports the updated generic copy count, preserving the rest of the map", () => {
    const onGenericCopiesChange = vi.fn();

    renderList({ genericCopies: { "beer-token": 1, "other-token": 2 }, onGenericCopiesChange });

    fireEvent.change(screen.getByLabelText("Beer Token"), { target: { value: "3" } });

    expect(onGenericCopiesChange).toHaveBeenLastCalledWith({ "beer-token": 3, "other-token": 2 });
  });

  it("reports influence and momentum count changes independently", () => {
    const onInfluenceCopiesChange = vi.fn();
    const onMomentumCopiesChange = vi.fn();

    renderList({ onInfluenceCopiesChange, onMomentumCopiesChange });

    fireEvent.change(screen.getByLabelText("Influence tokens (0-20)"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Momentum tokens (0-20)"), { target: { value: "8" } });

    expect(onInfluenceCopiesChange).toHaveBeenLastCalledWith(5);
    expect(onMomentumCopiesChange).toHaveBeenLastCalledWith(8);
  });

  it("reports a Goal Influence count change", () => {
    const onGoalInfluenceCopiesChange = vi.fn();

    renderList({ onGoalInfluenceCopiesChange });

    fireEvent.change(screen.getByLabelText("Goal Influence tokens"), { target: { value: "2" } });

    expect(onGoalInfluenceCopiesChange).toHaveBeenLastCalledWith(2);
  });
});
