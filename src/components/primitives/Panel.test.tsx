// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Panel } from "./Panel";

describe("Panel", () => {
  it("renders as an accessible group named after its title", () => {
    render(
      <Panel title="Shape">
        <p>content</p>
      </Panel>,
    );

    expect(screen.getByRole("group", { name: "Shape" })).toBeInTheDocument();
  });

  it("shows its children by default", () => {
    render(
      <Panel title="Shape">
        <p>content</p>
      </Panel>,
    );

    expect(screen.getByText("content")).toBeVisible();
  });

  it("hides its children after the toggle is clicked, and shows them again on a second click", async () => {
    render(
      <Panel title="Shape">
        <p>content</p>
      </Panel>,
    );

    const toggle = screen.getByRole("button", { name: "Shape" });

    await userEvent.click(toggle);
    expect(screen.getByText("content")).not.toBeVisible();

    await userEvent.click(toggle);
    expect(screen.getByText("content")).toBeVisible();
  });

  it("starts collapsed when defaultExpanded is false", () => {
    render(
      <Panel title="Shape" defaultExpanded={false}>
        <p>content</p>
      </Panel>,
    );

    expect(screen.getByText("content")).not.toBeVisible();
  });
});
