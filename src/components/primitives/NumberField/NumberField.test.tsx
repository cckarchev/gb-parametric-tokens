// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NumberField } from "./NumberField";

describe("NumberField", () => {
  it("renders the label and current value", () => {
    render(<NumberField label="Radius (mm)" value={12.5} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Radius (mm)")).toHaveValue(12.5);
  });

  it("reports the value as a number when changed", () => {
    const onChange = vi.fn();

    render(<NumberField label="Radius (mm)" value={12.5} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Radius (mm)"), { target: { value: "20" } });

    expect(onChange).toHaveBeenCalledWith(20);
  });

  it("passes min, max, and step through to the input", () => {
    render(
      <NumberField
        label="Radius (mm)"
        value={12.5}
        onChange={vi.fn()}
        min={0}
        max={50}
        step={0.5}
      />,
    );

    const input = screen.getByLabelText("Radius (mm)");

    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "50");
    expect(input).toHaveAttribute("step", "0.5");
  });
});
