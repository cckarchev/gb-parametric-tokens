// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CatalogCondition } from "../../../core/token/catalog/catalogTypes";
import { ConditionList } from "./ConditionList";

const conditions: CatalogCondition[] = [
  { id: "poison", name: "Poison", iconId: "poison" },
  { id: "knockedDown", name: "Knocked Down", iconId: "knock-down" },
];

describe("ConditionList", () => {
  it("shows one row per condition under a 'Conditions' panel, capped at 12 copies", () => {
    render(<ConditionList conditions={conditions} selection={{}} onSelectionChange={vi.fn()} />);

    expect(screen.getByText("Conditions")).toBeInTheDocument();
    expect(screen.getByLabelText("Poison")).toBeInTheDocument();
    expect(screen.getByLabelText("Knocked Down copies")).toHaveAttribute("max", "12");
  });

  it("defaults a condition missing from the selection to unchecked with 1 copy", () => {
    render(<ConditionList conditions={conditions} selection={{}} onSelectionChange={vi.fn()} />);

    expect(screen.getByLabelText("Poison")).not.toBeChecked();
    expect(screen.getByLabelText("Poison copies")).toHaveValue(1);
  });

  it("reports a row change keyed by the condition id, preserving the other rows", () => {
    const onSelectionChange = vi.fn();

    render(
      <ConditionList
        conditions={conditions}
        selection={{
          poison: { enabled: true, copies: 4 },
          knockedDown: { enabled: true, copies: 4 },
        }}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Poison copies"), { target: { value: "6" } });

    expect(onSelectionChange).toHaveBeenLastCalledWith({
      poison: { enabled: true, copies: 6 },
      knockedDown: { enabled: true, copies: 4 },
    });
  });

  it("enables every condition in one call when 'Select all' is checked, keeping their counts", () => {
    const onSelectionChange = vi.fn();

    render(
      <ConditionList
        conditions={conditions}
        selection={{ poison: { enabled: false, copies: 5 } }}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Select all"));

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      poison: { enabled: true, copies: 5 },
      knockedDown: { enabled: true, copies: 1 },
    });
  });
});
