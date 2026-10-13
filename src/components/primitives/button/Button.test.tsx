// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("renders its label and fires onClick when clicked", async () => {
    const onClick = vi.fn();

    render(<Button label="Add line" onClick={onClick} />);

    await userEvent.click(screen.getByRole("button", { name: "Add line" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when the disabled prop is true", () => {
    render(<Button label="Exporting..." onClick={vi.fn()} disabled={true} />);

    expect(screen.getByRole("button", { name: "Exporting..." })).toBeDisabled();
  });
});
