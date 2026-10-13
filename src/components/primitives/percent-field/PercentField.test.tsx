// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PercentField } from "./PercentField";

describe("PercentField", () => {
  it("shows a fraction as a whole percentage", () => {
    render(<PercentField label="Crest size (%)" value={0.55} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Crest size (%)")).toHaveValue(55);
  });

  it("reports the typed percentage back as a fraction, clamped to its bounds", () => {
    const onChange = vi.fn();

    render(
      <PercentField label="Crest size (%)" value={0.55} min={0.1} max={1.5} onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText("Crest size (%)"), { target: { value: "70" } });
    fireEvent.change(screen.getByLabelText("Crest size (%)"), { target: { value: "500" } });

    expect(onChange).toHaveBeenNthCalledWith(1, 0.7);
    expect(onChange).toHaveBeenNthCalledWith(2, 1.5);
  });
});
