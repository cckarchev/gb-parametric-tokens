// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SharedConfig } from "../../../core/token/catalog/buildTokenItems";
import { TokenConfigEditor } from "./TokenConfigEditor";

const sharedConfig: SharedConfig = {
  printProfileId: "fdm-04",
  arcShape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, nobDiameterMm: 24 },
  discShape: { type: "disc", diameterMm: 25 },
  goalInfluenceShape: { type: "disc", diameterMm: 20 },
  style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
  fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
  colorGroups: [
    { id: "base", name: "Body", color: "#cdb320" },
    { id: "text", name: "Text & symbols", color: "#000000" },
  ],
  influenceIconId: "influence",
  titleSizeMm: 7,
  subtitleSizeMm: 4.5,
  showSecondLine: true,
  balanceTwoLineSizes: false,
};

const openAdvancedSettings = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Advanced settings" }));
};

describe("TokenConfigEditor", () => {
  it("triggers the settings export callback", async () => {
    const onExportSettings = vi.fn();

    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={vi.fn()}
        onExportSettings={onExportSettings}
        onImportSettings={vi.fn()}
        importSettingsError={undefined}
      />,
    );

    await openAdvancedSettings();
    await userEvent.click(screen.getByRole("button", { name: "Export settings (.json)" }));

    expect(onExportSettings).toHaveBeenCalledOnce();
  });

  it("reports the chosen file for settings import", async () => {
    const onImportSettings = vi.fn();

    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={vi.fn()}
        onExportSettings={vi.fn()}
        onImportSettings={onImportSettings}
        importSettingsError={undefined}
      />,
    );

    await openAdvancedSettings();

    const file = new File(['{"printProfileId":"fdm-04"}'], "settings.json", {
      type: "application/json",
    });

    await userEvent.upload(screen.getByLabelText("Import settings (.json)"), file);

    expect(onImportSettings).toHaveBeenCalledWith(file);
  });

  it("shows the settings import error", async () => {
    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={vi.fn()}
        onExportSettings={vi.fn()}
        onImportSettings={vi.fn()}
        importSettingsError="This file is not a valid settings file."
      />,
    );

    await openAdvancedSettings();

    expect(screen.getByText("This file is not a valid settings file.")).toBeInTheDocument();
  });

  it("keeps the print profile selector visible without opening advanced settings", () => {
    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={vi.fn()}
        onExportSettings={vi.fn()}
        onImportSettings={vi.fn()}
        importSettingsError={undefined}
      />,
    );

    expect(screen.getByLabelText("Print profile")).toBeInTheDocument();
  });

  it("keeps relief and the guild colors visible without opening advanced settings", () => {
    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={vi.fn()}
        onExportSettings={vi.fn()}
        onImportSettings={vi.fn()}
        importSettingsError={undefined}
      />,
    );

    expect(screen.getByLabelText("Relief")).toHaveValue("raised");
    expect(screen.getByLabelText("Body")).toHaveValue("#cdb320");
    expect(screen.getByLabelText("Text & symbols")).toHaveValue("#000000");
  });

  it("updates only the relief field when the quick relief selector changes", async () => {
    const onChange = vi.fn();

    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={onChange}
        onExportSettings={vi.fn()}
        onImportSettings={vi.fn()}
        importSettingsError={undefined}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Relief"), "Engraved");

    expect(onChange).toHaveBeenCalledWith({
      ...sharedConfig,
      style: { ...sharedConfig.style, relief: "engraved" },
    });
  });

  it("renders the arc, disc, and Goal Influence shape editors with their own values once expanded", async () => {
    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={vi.fn()}
        onExportSettings={vi.fn()}
        onImportSettings={vi.fn()}
        importSettingsError={undefined}
      />,
    );

    await openAdvancedSettings();

    expect(screen.getByLabelText("Ribbon width (mm)")).toHaveValue(15);
    expect(
      screen.getAllByLabelText("Diameter (mm)").map((input) => (input as HTMLInputElement).value),
    ).toEqual(["25", "20"]);
  });

  it("updates the Goal Influence shape independently from the generic disc shape", async () => {
    const onChange = vi.fn();

    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={onChange}
        onExportSettings={vi.fn()}
        onImportSettings={vi.fn()}
        importSettingsError={undefined}
      />,
    );

    await openAdvancedSettings();

    fireEvent.change(screen.getAllByLabelText("Diameter (mm)")[1], { target: { value: "22" } });

    expect(onChange).toHaveBeenCalledWith({
      ...sharedConfig,
      goalInfluenceShape: { ...sharedConfig.goalInfluenceShape, diameterMm: 22 },
    });
  });

  it("updates the arc shape when the arc editor's ribbon width changes", async () => {
    const onChange = vi.fn();

    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={onChange}
        onExportSettings={vi.fn()}
        onImportSettings={vi.fn()}
        importSettingsError={undefined}
      />,
    );

    await openAdvancedSettings();

    fireEvent.change(screen.getByLabelText("Ribbon width (mm)"), { target: { value: "35" } });

    expect(onChange).toHaveBeenCalledWith({
      ...sharedConfig,
      arcShape: { ...sharedConfig.arcShape, ribbonWidthMm: 35 },
    });
  });

  it("ignores an arc-shape onChange when the arc editor's type selector is switched to disc", async () => {
    const onChange = vi.fn();

    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={onChange}
        onExportSettings={vi.fn()}
        onImportSettings={vi.fn()}
        importSettingsError={undefined}
      />,
    );

    await openAdvancedSettings();

    const shapeTypeSelectors = screen.getAllByLabelText("Shape type");

    await userEvent.selectOptions(shapeTypeSelectors[0], "Disc");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores a disc-shape onChange when the disc editor's type selector is switched to arc", async () => {
    const onChange = vi.fn();

    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={onChange}
        onExportSettings={vi.fn()}
        onImportSettings={vi.fn()}
        importSettingsError={undefined}
      />,
    );

    await openAdvancedSettings();

    const shapeTypeSelectors = screen.getAllByLabelText("Shape type");

    await userEvent.selectOptions(shapeTypeSelectors[1], "Arc");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("updates the title and subtitle sizes independently from advanced settings", async () => {
    const onChange = vi.fn();

    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={onChange}
        onExportSettings={vi.fn()}
        onImportSettings={vi.fn()}
        importSettingsError={undefined}
      />,
    );

    await openAdvancedSettings();

    fireEvent.change(screen.getByLabelText("Title size (mm)"), { target: { value: "9" } });

    expect(onChange).toHaveBeenCalledWith({ ...sharedConfig, titleSizeMm: 9 });
  });

  it("reports a body color change while preserving the text color group", async () => {
    const onChange = vi.fn();

    render(
      <TokenConfigEditor
        sharedConfig={sharedConfig}
        onChange={onChange}
        onExportSettings={vi.fn()}
        onImportSettings={vi.fn()}
        importSettingsError={undefined}
      />,
    );

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
