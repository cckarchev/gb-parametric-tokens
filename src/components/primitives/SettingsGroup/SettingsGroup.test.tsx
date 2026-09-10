// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsGroup } from "./SettingsGroup";

describe("SettingsGroup", () => {
  it("renders the title as a heading above its content", () => {
    render(
      <SettingsGroup title="Settings file">
        <button type="button">Export settings (.json)</button>
      </SettingsGroup>,
    );

    expect(screen.getByRole("heading", { name: "Settings file" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export settings (.json)" })).toBeInTheDocument();
  });
});
