// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CounterRecordEntry, CounterRecordList } from "./CounterRecordList";

const MAX_COPIES = 12;

const conditions: CounterRecordEntry[] = [
  { id: "poison", name: "Poison" },
  { id: "knockedDown", name: "Knocked Down" },
];

describe("CounterRecordList", () => {
  it("shows one row per entry under its titled panel, capped at the shared max copies", () => {
    render(
      <CounterRecordList
        title="Conditions"
        entries={conditions}
        maxCopies={MAX_COPIES}
        selection={{}}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Conditions")).toBeInTheDocument();
    expect(screen.getByLabelText("Poison")).toBeInTheDocument();
    expect(screen.getByLabelText("Knocked Down copies")).toHaveAttribute("max", "12");
  });

  it("caps an entry at its own maxCopies when it sets one", () => {
    const gamePlans: CounterRecordEntry[] = [{ id: "extraShot", name: "Extra Shot", maxCopies: 2 }];

    render(
      <CounterRecordList
        title="Game Plans"
        entries={gamePlans}
        maxCopies={MAX_COPIES}
        selection={{}}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Extra Shot copies")).toHaveAttribute("max", "2");
  });

  it("defaults an entry missing from the selection to unchecked with 1 copy", () => {
    render(
      <CounterRecordList
        title="Conditions"
        entries={conditions}
        maxCopies={MAX_COPIES}
        selection={{}}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Poison")).not.toBeChecked();
    expect(screen.getByLabelText("Poison copies")).toHaveValue(1);
  });

  it("reports a row change keyed by the entry id, preserving the other rows", () => {
    const onSelectionChange = vi.fn();

    render(
      <CounterRecordList
        title="Conditions"
        entries={conditions}
        maxCopies={MAX_COPIES}
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

  it("enables every entry in one call when 'Select all' is checked, keeping their counts", () => {
    const onSelectionChange = vi.fn();

    render(
      <CounterRecordList
        title="Conditions"
        entries={conditions}
        maxCopies={MAX_COPIES}
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
