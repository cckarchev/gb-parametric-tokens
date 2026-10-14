// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ColorField } from "./ColorField";

describe("ColorField", () => {
  it("renders the label and current color", () => {
    render(<ColorField label="Base" value="#2b2b2b" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Base")).toHaveValue("#2b2b2b");
  });

  it("reports the new color when changed", () => {
    const onChange = vi.fn();

    render(<ColorField label="Base" value="#2b2b2b" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Base"), { target: { value: "#ff0000" } });

    expect(onChange).toHaveBeenCalledWith("#ff0000");
  });
});
