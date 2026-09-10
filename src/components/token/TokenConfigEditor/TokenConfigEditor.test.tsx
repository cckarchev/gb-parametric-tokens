// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SharedConfig } from "../../../core/token/catalog/tokenItems/tokenItem";
import { TokenConfigEditor } from "./TokenConfigEditor";

const sharedConfig: SharedConfig = {
  printProfileId: "fdm-04",
  arcShape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, studDiameterMm: 24 },
  discShape: { type: "disc", diameterMm: 25 },
  goalInfluenceShape: { type: "disc", diameterMm: 20 },
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
  colorGroups: [
    { id: "base", name: "Body", color: "#cdb320" },
    { id: "text", name: "Text & symbols", color: "#000000" },
  ],
  influenceIconId: "influence",
  nameSizeMm: 7,
  effectSizeMm: 4.5,
  showSecondLine: true,
  balanceTwoLineSizes: false,
  iconOverflowBehavior: "none",
};

type TokenConfigEditorProps = Parameters<typeof TokenConfigEditor>[0];

const renderEditor = (overrides: Partial<TokenConfigEditorProps> = {}) => {
  render(
    <TokenConfigEditor
      sharedConfig={sharedConfig}
      onChange={vi.fn()}
      onExportSettings={vi.fn()}
      onImportSettings={vi.fn()}
      importSettingsError={undefined}
      {...overrides}
    />,
  );
};

const openAdvancedSettings = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Advanced settings" }));
};

describe("TokenConfigEditor", () => {
  it("triggers the settings export callback", async () => {
    const onExportSettings = vi.fn();

    renderEditor({ onExportSettings });

    await openAdvancedSettings();
    await userEvent.click(screen.getByRole("button", { name: "Export settings (.json)" }));

    expect(onExportSettings).toHaveBeenCalledOnce();
  });

  it("reports the chosen file for settings import", async () => {
    const onImportSettings = vi.fn();

    renderEditor({ onImportSettings });

    await openAdvancedSettings();

    const file = new File(['{"printProfileId":"fdm-04"}'], "settings.json", {
      type: "application/json",
    });

    await userEvent.upload(screen.getByLabelText("Import settings (.json)"), file);

    expect(onImportSettings).toHaveBeenCalledWith(file);
  });

  it("shows the settings import error", async () => {
    renderEditor({ importSettingsError: "This file is not a valid settings file." });

    await openAdvancedSettings();

    expect(screen.getByText("This file is not a valid settings file.")).toBeInTheDocument();
  });

  it("keeps the print profile selector visible without opening advanced settings", () => {
    renderEditor();

    expect(screen.getByLabelText("Print profile")).toBeInTheDocument();
  });

  it("keeps relief and the guild colors visible without opening advanced settings", () => {
    renderEditor();

    expect(screen.getByLabelText("Relief")).toHaveValue("raised");
    expect(screen.getByLabelText("Body")).toHaveValue("#cdb320");
    expect(screen.getByLabelText("Details")).toHaveValue("#000000");
  });

  it("updates only the relief field when the quick relief selector changes", async () => {
    const onChange = vi.fn();

    renderEditor({ onChange });

    await userEvent.selectOptions(screen.getByLabelText("Relief"), "Engraved");

    expect(onChange).toHaveBeenCalledWith({
      ...sharedConfig,
      style: { ...sharedConfig.style, relief: "engraved" },
    });
  });

  it("renders the arc, disc, and Goal Influence shape editors with their own values once expanded", async () => {
    renderEditor();

    await openAdvancedSettings();

    expect(screen.getByLabelText("Ribbon width (mm)")).toHaveValue(15);
    expect(
      screen.getAllByLabelText("Diameter (mm)").map((input) => (input as HTMLInputElement).value),
    ).toEqual(["25", "20"]);
  });

  it("updates the Goal Influence shape independently from the generic disc shape", async () => {
    const onChange = vi.fn();

    renderEditor({ onChange });

    await openAdvancedSettings();

    fireEvent.change(screen.getAllByLabelText("Diameter (mm)")[1], { target: { value: "22" } });

    expect(onChange).toHaveBeenCalledWith({
      ...sharedConfig,
      goalInfluenceShape: { ...sharedConfig.goalInfluenceShape, diameterMm: 22 },
    });
  });

  it("toggles the arc shape's stud fillet from the print options panel", async () => {
    const onChange = vi.fn();

    renderEditor({ onChange });

    await userEvent.click(screen.getByLabelText("Fillet between stud and arc"));

    expect(onChange).toHaveBeenCalledWith({
      ...sharedConfig,
      arcShape: { ...sharedConfig.arcShape, studFilletEnabled: true },
    });
  });

  it("updates the arc shape when the arc editor's ribbon width changes", async () => {
    const onChange = vi.fn();

    renderEditor({ onChange });

    await openAdvancedSettings();

    fireEvent.change(screen.getByLabelText("Ribbon width (mm)"), { target: { value: "35" } });

    expect(onChange).toHaveBeenCalledWith({
      ...sharedConfig,
      arcShape: { ...sharedConfig.arcShape, ribbonWidthMm: 35 },
    });
  });

  // Each slot is locked to one shape type: an arc token's shape can never become a disc, or vice
  // versa. Offering no type control at all is what enforces that.
  it("offers no shape type control in any of the shape slots", async () => {
    renderEditor();

    await openAdvancedSettings();

    expect(screen.queryByLabelText("Shape type")).not.toBeInTheDocument();
  });

  it("updates the name and effect text sizes independently from advanced settings", async () => {
    const onChange = vi.fn();

    renderEditor({ onChange });

    await openAdvancedSettings();

    fireEvent.change(screen.getByLabelText("Name size (mm)"), { target: { value: "9" } });

    expect(onChange).toHaveBeenCalledWith({ ...sharedConfig, nameSizeMm: 9 });
  });

  it("reports a body color change while preserving the text color group", async () => {
    const onChange = vi.fn();

    renderEditor({ onChange });

    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "#111111" } });

    expect(onChange).toHaveBeenCalledWith({
      ...sharedConfig,
      colorGroups: [
        { id: "base", name: "Body", color: "#111111" },
        { id: "text", name: "Text & symbols", color: "#000000" },
      ],
    });
  });
});
