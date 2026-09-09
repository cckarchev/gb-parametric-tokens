// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CounterCountField } from "./CounterCountField";

const renderField = (overrides: Partial<Parameters<typeof CounterCountField>[0]> = {}) => {
  return render(
    <CounterCountField
      label="Influence tokens"
      enabled={false}
      onEnabledChange={vi.fn()}
      copies={1}
      onCopiesChange={vi.fn()}
      min={1}
      max={20}
      {...overrides}
    />,
  );
};

describe("CounterCountField", () => {
  it("reflects the checkbox and copies state", () => {
    renderField({ enabled: true, copies: 5 });

    expect(screen.getByLabelText("Influence tokens")).toBeChecked();
    expect(screen.getByLabelText("Influence tokens copies")).toHaveValue(5);
  });

  it("reports a checkbox toggle", () => {
    const onEnabledChange = vi.fn();

    renderField({ enabled: false, onEnabledChange });

    fireEvent.click(screen.getByLabelText("Influence tokens"));

    expect(onEnabledChange).toHaveBeenCalledWith(true);
  });

  it("reports the new copies count when changed", () => {
    const onCopiesChange = vi.fn();

    renderField({ enabled: true, copies: 1, onCopiesChange });

    fireEvent.change(screen.getByLabelText("Influence tokens copies"), {
      target: { value: "8" },
    });

    expect(onCopiesChange).toHaveBeenCalledWith(8);
  });

  it("disables the copies stepper while unchecked, without hiding its value", () => {
    renderField({ enabled: false, copies: 3 });

    expect(screen.getByLabelText("Influence tokens copies")).toBeDisabled();
    expect(screen.getByLabelText("Influence tokens copies")).toHaveValue(3);
  });

  it("caps the copies stepper at the given min and max", () => {
    renderField({ min: 1, max: 2 });

    const input = screen.getByLabelText("Influence tokens copies");

    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("max", "2");
  });
});
