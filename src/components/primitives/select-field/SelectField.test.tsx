// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SelectField } from "./SelectField";

describe("SelectField", () => {
  const options = [
    { value: "disc", label: "Disc" },
    { value: "arc", label: "Arc" },
  ];

  it("renders every option and reflects the current value", () => {
    render(
      <SelectField
        label="Shape"
        value="disc"
        options={options}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Shape")).toHaveValue("disc");
    expect(screen.getByRole("option", { name: "Disc" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Arc" })).toBeInTheDocument();
  });

  it("reports the selected value when changed", async () => {
    const onChange = vi.fn();

    render(
      <SelectField
        label="Shape"
        value="disc"
        options={options}
        onChange={onChange}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Shape"), "Arc");

    expect(onChange).toHaveBeenCalledWith("arc");
  });
});
