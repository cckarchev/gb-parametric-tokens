// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ExportPanel } from "./ExportPanel";

describe("ExportPanel", () => {
  it("triggers the export callback when the button is clicked", async () => {
    const onExport = vi.fn();

    render(
      <ExportPanel
        isExporting={false}
        exportError={undefined}
        exportFailures={[]}
        onExport={onExport}
        isPreviewing={false}
        validCount={1}
        invalidCount={0}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Download tokens (.3mf)" }));

    expect(onExport).toHaveBeenCalledOnce();
  });

  it("disables the button and changes its label while exporting", () => {
    render(
      <ExportPanel
        isExporting={true}
        exportError={undefined}
        exportFailures={[]}
        onExport={vi.fn()}
        isPreviewing={false}
        validCount={1}
        invalidCount={0}
      />,
    );

    expect(screen.getByRole("button", { name: "Exporting..." })).toBeDisabled();
  });

  it("shows the export error as an alert", () => {
    render(
      <ExportPanel
        isExporting={false}
        exportError="Worker crashed"
        exportFailures={[]}
        onExport={vi.fn()}
        isPreviewing={false}
        validCount={1}
        invalidCount={0}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Worker crashed");
  });

  it("lists each export failure by label and reason", () => {
    render(
      <ExportPanel
        isExporting={false}
        exportError={undefined}
        exportFailures={[
          { id: "a", label: "Token A", reason: "Fails the minimum stroke width check." },
          { id: "b", label: "Token B", reason: "Invalid mesh (status: Error)." },
        ]}
        onExport={vi.fn()}
        isPreviewing={false}
        validCount={1}
        invalidCount={0}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Token A: Fails the minimum stroke width check.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Token B: Invalid mesh (status: Error).");
  });

  it("shows a neutral checking message while the preview is in flight", () => {
    const { container } = render(
      <ExportPanel
        isExporting={false}
        exportError={undefined}
        exportFailures={[]}
        onExport={vi.fn()}
        isPreviewing={true}
        validCount={0}
        invalidCount={0}
      />,
    );

    expect(screen.getByText("Checking tokens...")).toBeInTheDocument();
    expect(container.querySelector('[class*="statusReady"]')).toBeNull();
    expect(container.querySelector('[class*="statusAttention"]')).toBeNull();
  });

  it("shows a neutral message when nothing is selected", () => {
    render(
      <ExportPanel
        isExporting={false}
        exportError={undefined}
        exportFailures={[]}
        onExport={vi.fn()}
        isPreviewing={false}
        validCount={0}
        invalidCount={0}
      />,
    );

    expect(screen.getByText("No tokens selected.")).toBeInTheDocument();
  });

  it("shows a green ready message, correctly pluralized, once every token is valid", () => {
    const { container, rerender } = render(
      <ExportPanel
        isExporting={false}
        exportError={undefined}
        exportFailures={[]}
        onExport={vi.fn()}
        isPreviewing={false}
        validCount={77}
        invalidCount={0}
      />,
    );

    expect(screen.getByText("77 tokens ready to print.")).toBeInTheDocument();
    expect(container.querySelector('[class*="statusReady"]')).not.toBeNull();

    rerender(
      <ExportPanel
        isExporting={false}
        exportError={undefined}
        exportFailures={[]}
        onExport={vi.fn()}
        isPreviewing={false}
        validCount={1}
        invalidCount={0}
      />,
    );

    expect(screen.getByText("1 token ready to print.")).toBeInTheDocument();
  });

  it("shows a red attention message naming how many of the total need fixing", () => {
    const { container } = render(
      <ExportPanel
        isExporting={false}
        exportError={undefined}
        exportFailures={[]}
        onExport={vi.fn()}
        isPreviewing={false}
        validCount={74}
        invalidCount={3}
      />,
    );

    expect(screen.getByText("3 of 77 tokens need attention.")).toBeInTheDocument();
    expect(container.querySelector('[class*="statusAttention"]')).not.toBeNull();
  });
});
