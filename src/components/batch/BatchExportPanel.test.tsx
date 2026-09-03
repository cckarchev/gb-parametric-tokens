// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BatchExportPanel } from "./BatchExportPanel";

describe("BatchExportPanel", () => {
  it("triggers the export callback when the button is clicked", async () => {
    const onExport = vi.fn();

    render(
      <BatchExportPanel
        isExporting={false}
        exportError={undefined}
        exportFailures={[]}
        onExport={onExport}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Download batch (.zip)" }));

    expect(onExport).toHaveBeenCalledOnce();
  });

  it("disables the button and changes its label while exporting", () => {
    render(
      <BatchExportPanel
        isExporting={true}
        exportError={undefined}
        exportFailures={[]}
        onExport={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Exporting..." })).toBeDisabled();
  });

  it("shows the export error as an alert", () => {
    render(
      <BatchExportPanel
        isExporting={false}
        exportError="Worker crashed"
        exportFailures={[]}
        onExport={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Worker crashed");
  });

  it("lists each export failure by label and reason", () => {
    render(
      <BatchExportPanel
        isExporting={false}
        exportError={undefined}
        exportFailures={[
          { id: "a", label: "Token A", reason: "Fails the minimum stroke width check." },
          { id: "b", label: "Token B", reason: "Invalid mesh (status: Error)." },
        ]}
        onExport={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Token A: Fails the minimum stroke width check.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Token B: Invalid mesh (status: Error).");
  });
});
