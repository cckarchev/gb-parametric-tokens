// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SelectAllCheckbox } from "./SelectAllCheckbox";

describe("SelectAllCheckbox", () => {
  it("is reachable by its accessible name and reflects the checked state", () => {
    render(<SelectAllCheckbox checked onChange={vi.fn()} />);

    expect(screen.getByLabelText("Select all")).toBeChecked();
  });

  it("reports the next checked state when clicked", async () => {
    const onChange = vi.fn();

    render(<SelectAllCheckbox checked={false} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Select all"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("can be disabled", () => {
    render(<SelectAllCheckbox checked={false} onChange={vi.fn()} disabled />);

    expect(screen.getByLabelText("Select all")).toBeDisabled();
  });
});
