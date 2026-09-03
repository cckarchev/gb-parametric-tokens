// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("./components/editor/TokenEditor/TokenEditor", () => ({
  TokenEditor: () => <p>Single token editor</p>,
}));
vi.mock("./components/batch/BatchEditor/BatchEditor", () => ({
  BatchEditor: () => <p>Batch editor</p>,
}));

const { App } = await import("./App");

describe("App", () => {
  it("shows the batch editor by default", () => {
    render(<App />);

    expect(screen.getByText("Batch editor")).toBeInTheDocument();
    expect(screen.queryByText("Single token editor")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Batch" })).toBeDisabled();
  });

  it("switches to the single-token editor when its nav button is clicked", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Single token" }));

    expect(screen.getByText("Single token editor")).toBeInTheDocument();
    expect(screen.queryByText("Batch editor")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Single token" })).toBeDisabled();
  });
});
