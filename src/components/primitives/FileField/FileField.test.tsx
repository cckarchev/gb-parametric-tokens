// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FileField } from "./FileField";

const settingsFile = () => {
  return new File(['{"printProfileId":"fdm-04"}'], "settings.json", { type: "application/json" });
};

describe("FileField", () => {
  it("renders the label and the accepted types", () => {
    render(
      <FileField label="Import settings (.json)" accept="application/json" onSelect={vi.fn()} />,
    );

    expect(screen.getByLabelText("Import settings (.json)")).toHaveAttribute(
      "accept",
      "application/json",
    );
  });

  it("reports the chosen file", async () => {
    const onSelect = vi.fn();
    const file = settingsFile();

    render(
      <FileField label="Import settings (.json)" accept="application/json" onSelect={onSelect} />,
    );

    await userEvent.upload(screen.getByLabelText("Import settings (.json)"), file);

    expect(onSelect).toHaveBeenCalledWith(file);
  });

  it("clears the input so the same file can be chosen again", async () => {
    const onSelect = vi.fn();

    render(
      <FileField label="Import settings (.json)" accept="application/json" onSelect={onSelect} />,
    );

    const input = screen.getByLabelText("Import settings (.json)") as HTMLInputElement;

    await userEvent.upload(input, settingsFile());
    await userEvent.upload(input, settingsFile());

    expect(input.value).toBe("");
    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});
