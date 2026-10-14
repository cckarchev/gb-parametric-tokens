// @vitest-environment happy-dom
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/tokenItems/defaultSharedConfig";
import type { SharedConfig } from "@/core/token/catalog/tokenItems/tokenItem";

import { TokenConfigEditor } from "./TokenConfigEditor";

const sharedConfig: SharedConfig = {
  ...DEFAULT_SHARED_CONFIG,
  printProfileId: "fdm-04",
  arcShape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, studDiameterMm: 24 },
  discShape: { type: "disc", diameterMm: 25 },
  fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
  colorGroups: [
    { id: "base", name: "Body", color: "#cdb320" },
    { id: "text", name: "Text & symbols", color: "#000000" },
  ],
  influenceIconId: "Brewers",
  nameSizeMm: 7,
  effectSizeMm: 4.5,
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

const openSection = async (title: string) => {
  await openAdvancedSettings();
  await userEvent.click(screen.getByRole("button", { name: title }));
};

type ResetCase = {
  title: string;
  edited: Partial<SharedConfig>;
  restored: Partial<SharedConfig>;
};

const RESET_CASES: ResetCase[] = [
  {
    title: "General",
    edited: { style: { relief: "engraved", reliefHeightMm: 2, baseThicknessMm: 5 } },
    // Relief itself lives in print options and survives the reset.
    restored: {
      style: { ...DEFAULT_SHARED_CONFIG.style, relief: "engraved" },
      fitPolicy: DEFAULT_SHARED_CONFIG.fitPolicy,
    },
  },
  {
    title: "Arc tokens",
    edited: { nameSizeMm: 9 },
    restored: {
      arcShape: DEFAULT_SHARED_CONFIG.arcShape,
      nameSizeMm: DEFAULT_SHARED_CONFIG.nameSizeMm,
      effectSizeMm: DEFAULT_SHARED_CONFIG.effectSizeMm,
      characterToken: DEFAULT_SHARED_CONFIG.characterToken,
    },
  },
  {
    title: "Disc tokens",
    edited: { discShape: { type: "disc", diameterMm: 40 } },
    restored: {
      discShape: DEFAULT_SHARED_CONFIG.discShape,
      discToken: DEFAULT_SHARED_CONFIG.discToken,
    },
  },
  {
    title: "Goal Influence and ring badges",
    edited: { ringBadge: { textSizeMm: 4, textInsetMm: 2, crestScale: 0.3 } },
    restored: {
      goalInfluenceShape: DEFAULT_SHARED_CONFIG.goalInfluenceShape,
      ringBadge: DEFAULT_SHARED_CONFIG.ringBadge,
    },
  },
  {
    title: "Momentum",
    edited: { momentum: { textSizeMm: 9, ringInsetMm: 2, ringWidthMm: 1 } },
    restored: { momentum: DEFAULT_SHARED_CONFIG.momentum },
  },
  {
    title: "Conditions",
    edited: { condition: { iconScale: 0.3 } },
    restored: { condition: DEFAULT_SHARED_CONFIG.condition },
  },
  {
    title: "AOE templates",
    edited: {
      aoeTemplateVariant: "crowfoot",
      aoe: { ...DEFAULT_SHARED_CONFIG.aoe, bandWidthMm: 9 },
    },
    // The variant is a choice of what to print, not a tuning value, so it survives the reset.
    restored: { aoeTemplateVariant: "crowfoot", aoe: DEFAULT_SHARED_CONFIG.aoe },
  },
];

describe("TokenConfigEditor", () => {
  it("triggers the settings export callback", async () => {
    const onExportSettings = vi.fn();

    renderEditor({ onExportSettings });

    await openSection("General");
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

  it("toggles the arc shape's stud fillet from the arc tokens section", async () => {
    const onChange = vi.fn();

    renderEditor({ onChange });

    await openSection("Arc tokens");
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

    fireEvent.change(screen.getByLabelText("Ribbon width (mm)"), { target: { value: "18" } });

    expect(onChange).toHaveBeenCalledWith({
      ...sharedConfig,
      arcShape: { ...sharedConfig.arcShape, ribbonWidthMm: 18 },
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

  it("no longer offers the AOE variant or the stud fillet in print options", () => {
    renderEditor();

    const printOptions = screen.getByRole("group", { name: "Print options" });

    expect(within(printOptions).queryByLabelText("AOE templates")).not.toBeInTheDocument();
    expect(
      within(printOptions).queryByLabelText("Fillet between stud and arc"),
    ).not.toBeInTheDocument();
  });

  it("shows only the selected AOE variant's fields", async () => {
    renderEditor({ sharedConfig: { ...sharedConfig, aoeTemplateVariant: "crowfoot" } });

    await openSection("AOE templates");

    const section = screen.getByRole("group", { name: "AOE templates" });

    expect(within(section).getByLabelText("Spoke count")).toBeInTheDocument();
    expect(within(section).getByLabelText("Band width (mm)")).toBeInTheDocument();
    expect(within(section).queryByLabelText("Text inset from rim (mm)")).not.toBeInTheDocument();
  });

  it("edits an icon size as a percentage", async () => {
    const onChange = vi.fn();

    renderEditor({ onChange });
    await openSection("Conditions");

    fireEvent.change(screen.getByLabelText("Icon size (%)"), { target: { value: "60" } });

    expect(onChange).toHaveBeenCalledWith({ ...sharedConfig, condition: { iconScale: 0.6 } });
  });

  it("disables the crow's foot fillet radius while the fillet is off", async () => {
    const crowfoot = { ...sharedConfig.aoe.crowfoot, filletEnabled: false };

    renderEditor({
      sharedConfig: {
        ...sharedConfig,
        aoeTemplateVariant: "crowfoot",
        aoe: { ...sharedConfig.aoe, crowfoot },
      },
    });
    await openSection("AOE templates");

    expect(screen.getByLabelText("Fillet radius (mm)")).toBeDisabled();
  });

  it.each(RESET_CASES)(
    "resets only the $title section's own fields",
    async ({ title, edited, restored }) => {
      const onChange = vi.fn();
      const editedConfig = { ...sharedConfig, ...edited };

      renderEditor({ sharedConfig: editedConfig, onChange });
      await openSection(title);
      await userEvent.click(screen.getByRole("button", { name: `Reset ${title} to defaults` }));

      expect(onChange).toHaveBeenCalledWith({ ...editedConfig, ...restored });
    },
  );
});
