// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ExportPanel } from "./ExportPanel";

describe("ExportPanel", () => {
  it("triggers the 3mf export callback", async () => {
    const onExportThreeMf = vi.fn();

    render(
      <ExportPanel
        onExportThreeMf={onExportThreeMf}
        exportError={undefined}
        onExportSpecJson={vi.fn()}
        onImportSpecJson={vi.fn()}
        importError={undefined}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Download .3mf" }));

    expect(onExportThreeMf).toHaveBeenCalledOnce();
  });

  it("triggers the spec export callback", async () => {
    const onExportSpecJson = vi.fn();

    render(
      <ExportPanel
        onExportThreeMf={vi.fn()}
        exportError={undefined}
        onExportSpecJson={onExportSpecJson}
        onImportSpecJson={vi.fn()}
        importError={undefined}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Download spec (.json)" }));

    expect(onExportSpecJson).toHaveBeenCalledOnce();
  });

  it("reports the chosen file for import", async () => {
    const onImportSpecJson = vi.fn();

    render(
      <ExportPanel
        onExportThreeMf={vi.fn()}
        exportError={undefined}
        onExportSpecJson={vi.fn()}
        onImportSpecJson={onImportSpecJson}
        importError={undefined}
      />,
    );

    const file = new File(['{"version":1}'], "spec.json", { type: "application/json" });

    await userEvent.upload(screen.getByLabelText("Load spec (.json)"), file);

    expect(onImportSpecJson).toHaveBeenCalledWith(file);
  });

  it("shows export and import errors", () => {
    render(
      <ExportPanel
        onExportThreeMf={vi.fn()}
        exportError="Worker crashed"
        onExportSpecJson={vi.fn()}
        onImportSpecJson={vi.fn()}
        importError="Invalid spec file"
      />,
    );

    expect(screen.getByText("Worker crashed")).toBeInTheDocument();
    expect(screen.getByText("Invalid spec file")).toBeInTheDocument();
  });
});
