// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CounterCountField } from "./CounterCountField";

describe("CounterCountField", () => {
  it("reflects the given value", () => {
    render(<CounterCountField label="Influence tokens (0-20)" value={5} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Influence tokens (0-20)")).toHaveValue(5);
  });

  it("reports the new value when changed", () => {
    const onChange = vi.fn();

    render(<CounterCountField label="Influence tokens (0-20)" value={0} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Influence tokens (0-20)"), {
      target: { value: "8" },
    });

    expect(onChange).toHaveBeenCalledWith(8);
  });

  it("caps the input at 0 and 20", () => {
    render(<CounterCountField label="Influence tokens (0-20)" value={5} onChange={vi.fn()} />);

    const input = screen.getByLabelText("Influence tokens (0-20)");

    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "20");
  });
});
