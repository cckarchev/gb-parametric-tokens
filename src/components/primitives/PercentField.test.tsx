// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PercentField } from "./PercentField";

const CREST_SCALE = 0.55;
const CREST_PERCENT = 55;
const MIN_SCALE = 0.1;
const MAX_SCALE = 1.5;

describe("PercentField", () => {
  it("shows a fraction as a whole percentage", () => {
    render(
      <PercentField
        label="Crest size (%)"
        value={CREST_SCALE}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Crest size (%)")).toHaveValue(CREST_PERCENT);
  });

  it("reports the typed percentage back as a fraction, clamped to its bounds", () => {
    const onChange = vi.fn();

    render(
      <PercentField
        label="Crest size (%)"
        value={CREST_SCALE}
        min={MIN_SCALE}
        max={MAX_SCALE}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Crest size (%)"), {
      target: { value: "70" },
    });
    fireEvent.change(screen.getByLabelText("Crest size (%)"), {
      target: { value: "500" },
    });

    const typedScale = 0.7;

    expect(onChange).toHaveBeenNthCalledWith(1, typedScale);
    expect(onChange).toHaveBeenNthCalledWith(2, MAX_SCALE);
  });
});
