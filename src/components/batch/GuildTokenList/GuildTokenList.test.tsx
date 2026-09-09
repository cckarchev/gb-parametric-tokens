// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GuildCatalog } from "../../../core/token/catalog/catalogTypes";
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
      genericTokens={{}}
      onGenericTokensChange={vi.fn()}
      influence={{ enabled: false, copies: 1 }}
      onInfluenceChange={vi.fn()}
      momentum={{ enabled: false, copies: 1 }}
      onMomentumChange={vi.fn()}
      goalInfluence={{ enabled: false, copies: 1 }}
      onGoalInfluenceChange={vi.fn()}
      {...overrides}
    />,
  );
};

describe("GuildTokenList", () => {
  it("shows the influence, momentum, Goal Influence, and generic token fields under a single 'Guild tokens' panel", () => {
    renderList();

    expect(screen.getByText("Guild tokens")).toBeInTheDocument();
    expect(screen.getByLabelText("Influence tokens")).toBeInTheDocument();
    expect(screen.getByLabelText("Momentum tokens")).toBeInTheDocument();
    expect(screen.getByLabelText("Goal Influence tokens")).toBeInTheDocument();
    expect(screen.getByLabelText("Beer Token")).toBeInTheDocument();
  });

  it("defaults an unlisted generic token to unchecked with a copies count of 1", () => {
    renderList();

    expect(screen.getByLabelText("Beer Token")).not.toBeChecked();
    expect(screen.getByLabelText("Beer Token copies")).toHaveValue(1);
  });

  it("reports an enabled change for a generic token, preserving the rest of the map", () => {
    const onGenericTokensChange = vi.fn();

    renderList({
      genericTokens: {
        "beer-token": { enabled: false, copies: 1 },
        "other-token": { enabled: true, copies: 2 },
      },
      onGenericTokensChange,
    });

    fireEvent.click(screen.getByLabelText("Beer Token"));

    expect(onGenericTokensChange).toHaveBeenLastCalledWith({
      "beer-token": { enabled: true, copies: 1 },
      "other-token": { enabled: true, copies: 2 },
    });
  });

  it("reports a generic token's copies count change", () => {
    const onGenericTokensChange = vi.fn();

    renderList({
      genericTokens: { "beer-token": { enabled: true, copies: 1 } },
      onGenericTokensChange,
    });

    fireEvent.change(screen.getByLabelText("Beer Token copies"), {
      target: { value: "3" },
    });

    expect(onGenericTokensChange).toHaveBeenLastCalledWith({
      "beer-token": { enabled: true, copies: 3 },
    });
  });

  it("caps Influence and Momentum at 1-20 copies, independently of each other", () => {
    const onInfluenceChange = vi.fn();
    const onMomentumChange = vi.fn();

    renderList({
      influence: { enabled: true, copies: 1 },
      onInfluenceChange,
      momentum: { enabled: true, copies: 1 },
      onMomentumChange,
    });

    expect(screen.getByLabelText("Influence tokens copies")).toHaveAttribute("max", "20");
    expect(screen.getByLabelText("Momentum tokens copies")).toHaveAttribute("max", "20");

    fireEvent.change(screen.getByLabelText("Influence tokens copies"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Momentum tokens copies"), {
      target: { value: "8" },
    });

    expect(onInfluenceChange).toHaveBeenLastCalledWith({ enabled: true, copies: 5 });
    expect(onMomentumChange).toHaveBeenLastCalledWith({ enabled: true, copies: 8 });
  });

  it("caps Goal Influence at 1-2 copies, unlike the other 1-20 counters", () => {
    const onGoalInfluenceChange = vi.fn();

    renderList({ goalInfluence: { enabled: true, copies: 1 }, onGoalInfluenceChange });

    const input = screen.getByLabelText("Goal Influence tokens copies");

    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("max", "2");

    fireEvent.change(input, { target: { value: "2" } });

    expect(onGoalInfluenceChange).toHaveBeenLastCalledWith({ enabled: true, copies: 2 });
  });

  it("toggles Influence on independently from its copies count", () => {
    const onInfluenceChange = vi.fn();

    renderList({ influence: { enabled: false, copies: 7 }, onInfluenceChange });

    fireEvent.click(screen.getByLabelText("Influence tokens"));

    expect(onInfluenceChange).toHaveBeenCalledWith({ enabled: true, copies: 7 });
  });

  it("disables a counter's copies stepper while its checkbox is unchecked", () => {
    renderList({ influence: { enabled: false, copies: 1 } });

    expect(screen.getByLabelText("Influence tokens copies")).toBeDisabled();
  });

  it("enables every counter, including generics, when 'Select all' is checked", () => {
    const onInfluenceChange = vi.fn();
    const onMomentumChange = vi.fn();
    const onGoalInfluenceChange = vi.fn();
    const onGenericTokensChange = vi.fn();

    renderList({
      influence: { enabled: false, copies: 13 },
      onInfluenceChange,
      momentum: { enabled: false, copies: 15 },
      onMomentumChange,
      goalInfluence: { enabled: false, copies: 2 },
      onGoalInfluenceChange,
      genericTokens: { "beer-token": { enabled: false, copies: 4 } },
      onGenericTokensChange,
    });

    fireEvent.click(screen.getByLabelText("Select all"));

    expect(onInfluenceChange).toHaveBeenCalledWith({ enabled: true, copies: 13 });
    expect(onMomentumChange).toHaveBeenCalledWith({ enabled: true, copies: 15 });
    expect(onGoalInfluenceChange).toHaveBeenCalledWith({ enabled: true, copies: 2 });
    expect(onGenericTokensChange).toHaveBeenCalledWith({
      "beer-token": { enabled: true, copies: 4 },
    });
  });

  it("shows 'Select all' as checked only once every counter is enabled", () => {
    const { rerender } = renderList({
      influence: { enabled: true, copies: 13 },
      momentum: { enabled: true, copies: 15 },
      goalInfluence: { enabled: false, copies: 2 },
      genericTokens: { "beer-token": { enabled: true, copies: 4 } },
    });

    expect(screen.getByLabelText("Select all")).not.toBeChecked();

    rerender(
      <GuildTokenList
        catalog={catalog}
        genericTokens={{ "beer-token": { enabled: true, copies: 4 } }}
        onGenericTokensChange={vi.fn()}
        influence={{ enabled: true, copies: 13 }}
        onInfluenceChange={vi.fn()}
        momentum={{ enabled: true, copies: 15 }}
        onMomentumChange={vi.fn()}
        goalInfluence={{ enabled: true, copies: 2 }}
        onGoalInfluenceChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Select all")).toBeChecked();
  });
});
