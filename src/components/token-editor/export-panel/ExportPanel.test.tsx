// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ExportPanel } from "./ExportPanel";

type ExportPanelProps = Parameters<typeof ExportPanel>[0];

// Defaults describe the panel's resting state: idle, one valid token, nothing
// wrong. Each test overrides only the props it is actually about, so what it
// sets is what it covers.
const panelElement = (overrides: Partial<ExportPanelProps> = {}) => (
  <ExportPanel
    isExporting={false}
    exportError={undefined}
    exportFailures={[]}
    onExport={vi.fn()}
    isPreviewing={false}
    validCount={1}
    invalidCount={0}
    invalidItems={[]}
    {...overrides}
  />
);

const renderPanel = (overrides: Partial<ExportPanelProps> = {}) => {
  const { container, rerender } = render(panelElement(overrides));

  return {
    container,
    rerenderPanel: (next: Partial<ExportPanelProps> = {}) => {
      rerender(panelElement(next));
    },
  };
};

// The status is also mirrored in a hidden <output> for screen readers; these
// lookups target the copy people see.
const getVisibleText = (text: string) =>
  screen.getByText(text, { ignore: "script, style, output" });

describe("ExportPanel", () => {
  it("triggers the export callback when the button is clicked", async () => {
    const onExport = vi.fn();

    renderPanel({ onExport });

    await userEvent.click(
      screen.getByRole("button", { name: "Download tokens (.3mf)" }),
    );

    expect(onExport).toHaveBeenCalledOnce();
  });

  it("disables the button and changes its label while exporting", () => {
    renderPanel({ isExporting: true });

    expect(screen.getByRole("button", { name: "Exporting..." })).toBeDisabled();
  });

  it("shows the export error as an alert", () => {
    renderPanel({ exportError: "Worker crashed" });

    expect(screen.getByRole("alert")).toHaveTextContent("Worker crashed");
  });

  it("lists each export failure by label and reason", () => {
    renderPanel({
      exportFailures: [
        {
          id: "a",
          label: "Token A",
          reason: "Fails the minimum stroke width check.",
        },
        { id: "b", label: "Token B", reason: "Invalid mesh (status: Error)." },
      ],
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Token A: Fails the minimum stroke width check.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Token B: Invalid mesh (status: Error).",
    );
  });

  it("shows a neutral checking message while the preview is in flight", () => {
    const { container } = renderPanel({ isPreviewing: true, validCount: 0 });

    expect(getVisibleText("Checking tokens...")).toBeInTheDocument();
    expect(container.querySelector('[class*="statusReady"]')).toBeNull();
    expect(container.querySelector('[class*="statusAttention"]')).toBeNull();
  });

  it("shows a neutral message when nothing is selected", () => {
    renderPanel({ validCount: 0 });

    expect(getVisibleText("No tokens selected.")).toBeInTheDocument();
  });
});

describe("ExportPanel status message", () => {
  it("announces the status as it changes, also when it turns into the attention list", () => {
    const { rerenderPanel } = renderPanel({ isPreviewing: true });

    expect(screen.getByRole("status")).toHaveTextContent("Checking tokens...");

    rerenderPanel({
      validCount: 1,
      invalidCount: 1,
      invalidItems: [
        {
          id: "a",
          name: "Beer Token",
          reason: "1 of 2 details too thin to print.",
        },
      ],
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "1 of 2 tokens need attention.",
    );
  });

  it("shows a green ready message, correctly pluralized, once every token is valid", () => {
    const { container, rerenderPanel } = renderPanel({ validCount: 77 });

    expect(getVisibleText("77 tokens ready to print.")).toBeInTheDocument();
    expect(container.querySelector('[class*="statusReady"]')).not.toBeNull();

    rerenderPanel({ validCount: 1 });

    expect(getVisibleText("1 token ready to print.")).toBeInTheDocument();
  });

  it("shows a red attention message naming how many of the total need fixing", () => {
    const { container } = renderPanel({
      validCount: 74,
      invalidCount: 3,
      invalidItems: [
        {
          id: "a",
          name: "Beer Token",
          reason: "1 of 2 details too thin to print.",
        },
        {
          id: "b",
          name: "Marked Target",
          reason: "1 of 1 detail too thin to print.",
        },
        {
          id: "c",
          name: "Commanding Aura",
          reason: "3 of 4 details too thin to print.",
        },
      ],
    });

    expect(
      getVisibleText("3 of 77 tokens need attention."),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[class*="statusAttention"]'),
    ).not.toBeNull();
  });
});

describe("ExportPanel attention list", () => {
  it("starts the attention list collapsed", () => {
    const { container } = renderPanel({
      validCount: 12,
      invalidCount: 2,
      invalidItems: [
        {
          id: "a",
          name: "Beer Token",
          reason: "1 of 2 details too thin to print.",
        },
        {
          id: "b",
          name: "Marked Target",
          reason: "1 of 1 detail too thin to print.",
        },
      ],
    });

    expect(
      getVisibleText("2 of 14 tokens need attention."),
    ).toBeInTheDocument();
    expect(container.querySelector("details")).not.toHaveAttribute("open");
  });
});

describe("ExportPanel ungrouped tokens to fix", () => {
  it("lists each ungrouped token that needs attention by name, with its own reason, once expanded", async () => {
    renderPanel({
      validCount: 12,
      invalidCount: 2,
      invalidItems: [
        {
          id: "a",
          name: "Beer Token",
          reason: "1 of 2 details too thin to print.",
        },
        {
          id: "b",
          name: "Marked Target",
          reason: "1 of 1 detail too thin to print.",
        },
      ],
    });

    await userEvent.click(getVisibleText("2 of 14 tokens need attention."));

    const list = screen.getByRole("list", { name: "Tokens needing attention" });

    expect(list).toHaveTextContent(
      "Beer Token1 of 2 details too thin to print.",
    );
    expect(list).toHaveTextContent(
      "Marked Target1 of 1 detail too thin to print.",
    );
  });

  it("sets an ungrouped token's own name apart from its reason with its own element", async () => {
    renderPanel({
      validCount: 12,
      invalidCount: 1,
      invalidItems: [
        {
          id: "a",
          name: "Beer Token",
          reason: "1 of 2 details too thin to print.",
        },
      ],
    });

    await userEvent.click(getVisibleText("1 of 13 tokens need attention."));

    expect(getVisibleText("Beer Token").tagName).toBe("STRONG");
  });
});

describe("ExportPanel character tokens to fix", () => {
  it("groups a character's invalid tokens under one heading with their own name, instead of repeating it", async () => {
    renderPanel({
      validCount: 12,
      invalidCount: 2,
      invalidItems: [
        {
          id: "sugar-0",
          group: "Sugar",
          name: "Chef's Special",
          reason: "18 of 36 details too thin to print.",
        },
        {
          id: "sugar-1",
          group: "Sugar",
          name: "Chilli Cook Out",
          reason: "19 of 37 details too thin to print.",
        },
      ],
    });

    await userEvent.click(getVisibleText("2 of 14 tokens need attention."));

    expect(getVisibleText("Sugar").tagName).toBe("STRONG");
    expect(screen.queryByText("Sugar:")).toBeNull();

    const list = screen.getByRole("list", { name: "Tokens needing attention" });

    expect(list).toHaveTextContent(
      "Chef's Special: 18 of 36 details too thin to print.",
    );
    expect(list).toHaveTextContent(
      "Chilli Cook Out: 19 of 37 details too thin to print.",
    );
  });

  it("shows no attention list once nothing is invalid", () => {
    renderPanel({ validCount: 12 });

    expect(
      screen.queryByRole("list", { name: "Tokens needing attention" }),
    ).toBeNull();
  });
});
