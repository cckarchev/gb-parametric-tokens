// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CheckboxField } from "./CheckboxField";

describe("CheckboxField", () => {
  it("renders the label and reflects the checked value", () => {
    render(
      <CheckboxField
        label="Allow two lines"
        checked={true}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Allow two lines")).toBeChecked();
  });

  it("reports the new checked state when toggled", () => {
    const onChange = vi.fn();

    render(
      <CheckboxField
        label="Allow two lines"
        checked={false}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Allow two lines"));

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
