// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TextField } from "./TextField";

describe("TextField", () => {
  it("renders the label, value, and placeholder", () => {
    render(
      <TextField
        label="Line 1"
        value="Commanding Aura"
        onChange={vi.fn()}
        placeholder="Enter text"
      />,
    );

    const input = screen.getByLabelText("Line 1");

    expect(input).toHaveValue("Commanding Aura");
    expect(input).toHaveAttribute("placeholder", "Enter text");
  });

  it("reports the new value when changed", () => {
    const onChange = vi.fn();

    render(<TextField label="Line 1" value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Line 1"), { target: { value: "Marked Target" } });

    expect(onChange).toHaveBeenCalledWith("Marked Target");
  });
});
