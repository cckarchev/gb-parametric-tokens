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

  it("hides its children by default", () => {
    render(
      <Panel title="Shape">
        <p>content</p>
      </Panel>,
    );

    expect(screen.getByText("content")).not.toBeVisible();
  });

  it("shows its children after the toggle is clicked, and hides them again on a second click", async () => {
    render(
      <Panel title="Shape">
        <p>content</p>
      </Panel>,
    );

    const toggle = screen.getByRole("button", { name: "Shape" });

    await userEvent.click(toggle);
    expect(screen.getByText("content")).toBeVisible();

    await userEvent.click(toggle);
    expect(screen.getByText("content")).not.toBeVisible();
  });

  it("starts expanded when defaultExpanded is true", () => {
    render(
      <Panel title="Shape" defaultExpanded={true}>
        <p>content</p>
      </Panel>,
    );

    expect(screen.getByText("content")).toBeVisible();
  });

  it("renders a header accessory next to the collapse toggle without it triggering the toggle", async () => {
    render(
      <Panel
        title="Shape"
        defaultExpanded={true}
        headerAccessory={<button type="button">Accessory</button>}>
        <p>content</p>
      </Panel>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Accessory" }));

    expect(screen.getByText("content")).toBeVisible();
  });
});
