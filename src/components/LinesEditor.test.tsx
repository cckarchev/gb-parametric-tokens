// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ColorGroupSpec, LineSpec } from "../core/token/types";
import { LinesEditor } from "./LinesEditor";

const colorGroups: ColorGroupSpec[] = [{ id: "accent", name: "Accent", color: "#ffffff" }];

describe("LinesEditor", () => {
  it("renders one row per line, with a base color group option", () => {
    const lines: LineSpec[] = [{ text: "Commanding Aura", sizeMm: 6 }];

    render(<LinesEditor lines={lines} colorGroups={colorGroups} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Text")).toHaveValue("Commanding Aura");
    expect(screen.getByLabelText("Size (mm)")).toHaveValue(6);
    expect(screen.getByRole("option", { name: "(base)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Accent" })).toBeInTheDocument();
  });

  it("reports a text change while preserving the rest of the line", () => {
    const onChange = vi.fn();
    const lines: LineSpec[] = [{ text: "Commanding Aura", sizeMm: 6 }];

    render(<LinesEditor lines={lines} colorGroups={colorGroups} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Text"), { target: { value: "Marked Target" } });

    expect(onChange).toHaveBeenCalledWith([{ text: "Marked Target", sizeMm: 6 }]);
  });

  it("adds a default line when 'Add line' is clicked", async () => {
    const onChange = vi.fn();

    render(<LinesEditor lines={[]} colorGroups={colorGroups} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Add line" }));

    expect(onChange).toHaveBeenCalledWith([{ text: "", sizeMm: 6 }]);
  });

  it("removes a line when its 'Remove line' button is clicked", async () => {
    const onChange = vi.fn();
    const lines: LineSpec[] = [
      { text: "Commanding Aura", sizeMm: 6 },
      { text: "Marked Target", sizeMm: 6 },
    ];

    render(<LinesEditor lines={lines} colorGroups={colorGroups} onChange={onChange} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Remove line" })[0]);

    expect(onChange).toHaveBeenCalledWith([{ text: "Marked Target", sizeMm: 6 }]);
  });

  it("hides 'Add line' once there are already two lines, since an arc only fits two", () => {
    const lines: LineSpec[] = [
      { text: "Commanding Aura", sizeMm: 6 },
      { text: "4in Aura +1 TAC +1 DMG", sizeMm: 4 },
    ];

    render(<LinesEditor lines={lines} colorGroups={colorGroups} onChange={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Add line" })).not.toBeInTheDocument();
  });
});
