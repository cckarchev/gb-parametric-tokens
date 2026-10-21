// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NumberField } from "./NumberField";

const RADIUS_MM = 12.5;
const MAX_COPIES = 3;

describe("NumberField", () => {
  it("renders the label and current value", () => {
    render(
      <NumberField label="Radius (mm)" value={RADIUS_MM} onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText("Radius (mm)")).toHaveValue(RADIUS_MM);
  });

  it("reports the value as a number when changed", () => {
    const onChange = vi.fn();

    render(
      <NumberField label="Radius (mm)" value={RADIUS_MM} onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText("Radius (mm)"), {
      target: { value: "20" },
    });

    const typedRadiusMm = 20;

    expect(onChange).toHaveBeenCalledWith(typedRadiusMm);
  });

  it("passes min and max through to the input", () => {
    render(
      <NumberField
        label="Radius (mm)"
        value={RADIUS_MM}
        onChange={vi.fn()}
        min={0}
        max={50}
      />,
    );

    const input = screen.getByLabelText("Radius (mm)");

    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "50");
  });
});

describe("NumberField clamping", () => {
  it("clamps a typed value above the max down to the max", () => {
    const onChange = vi.fn();

    render(
      <NumberField
        label="Copies"
        value={1}
        onChange={onChange}
        min={1}
        max={MAX_COPIES}
      />,
    );

    fireEvent.change(screen.getByLabelText("Copies"), {
      target: { value: "9" },
    });

    expect(onChange).toHaveBeenCalledWith(MAX_COPIES);
  });

  it("clamps a typed value below the min up to the min", () => {
    const onChange = vi.fn();

    render(
      <NumberField
        label="Copies"
        value={2}
        onChange={onChange}
        min={1}
        max={MAX_COPIES}
      />,
    );

    fireEvent.change(screen.getByLabelText("Copies"), {
      target: { value: "0" },
    });

    expect(onChange).toHaveBeenCalledWith(1);
  });
});

describe("NumberField stepper mode", () => {
  it("increases the value when the + button is clicked", async () => {
    const onChange = vi.fn();

    render(
      <NumberField
        label="Copies"
        value={1}
        onChange={onChange}
        max={MAX_COPIES}
        stepper
      />,
    );

    await userEvent.click(screen.getByLabelText("Increase Copies"));

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("decreases the value when the - button is clicked", async () => {
    const onChange = vi.fn();

    render(
      <NumberField
        label="Copies"
        value={2}
        onChange={onChange}
        min={1}
        stepper
      />,
    );

    await userEvent.click(screen.getByLabelText("Decrease Copies"));

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("disables the - button at the min and the + button at the max", () => {
    render(
      <NumberField
        label="Copies"
        value={2}
        onChange={vi.fn()}
        min={1}
        max={2}
        stepper
      />,
    );

    expect(screen.getByLabelText("Decrease Copies")).not.toBeDisabled();
    expect(screen.getByLabelText("Increase Copies")).toBeDisabled();
  });
});

describe("NumberField stepper mode typing", () => {
  it("keeps the input itself editable and reachable by its label", () => {
    render(
      <NumberField
        label="Copies"
        value={2}
        onChange={vi.fn()}
        min={1}
        max={5}
        stepper
      />,
    );

    expect(screen.getByLabelText("Copies")).toHaveValue(2);
  });

  it("clamps a typed value to the min/max range", () => {
    const onChange = vi.fn();

    render(
      <NumberField
        label="Copies"
        value={2}
        onChange={onChange}
        min={1}
        max={MAX_COPIES}
        stepper
      />,
    );

    fireEvent.change(screen.getByLabelText("Copies"), {
      target: { value: "9" },
    });

    expect(onChange).toHaveBeenCalledWith(MAX_COPIES);
  });
});
