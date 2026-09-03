// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ColorGroupSpec } from "../../../core/token/types";
import { ColorGroupsEditor } from "./ColorGroupsEditor";

const baseGroups: ColorGroupSpec[] = [{ id: "base", name: "Base", color: "#2b2b2b" }];

describe("ColorGroupsEditor", () => {
  it("renders one row per color group", () => {
    render(<ColorGroupsEditor colorGroups={baseGroups} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Id")).toHaveValue("base");
    expect(screen.getByLabelText("Name")).toHaveValue("Base");
    expect(screen.getByLabelText("Color")).toHaveValue("#2b2b2b");
  });

  it("reports a name change while preserving the rest of the group", () => {
    const onChange = vi.fn();

    render(<ColorGroupsEditor colorGroups={baseGroups} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Primary" } });

    expect(onChange).toHaveBeenCalledWith([{ id: "base", name: "Primary", color: "#2b2b2b" }]);
  });

  it("adds a default color group when 'Add color group' is clicked", async () => {
    const onChange = vi.fn();

    render(<ColorGroupsEditor colorGroups={baseGroups} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Add color group" }));

    expect(onChange).toHaveBeenCalledWith([...baseGroups, { id: "", name: "", color: "#CCCCCC" }]);
  });

  it("removes a color group when its 'Remove color group' button is clicked", async () => {
    const onChange = vi.fn();
    const twoGroups: ColorGroupSpec[] = [
      { id: "base", name: "Base", color: "#2b2b2b" },
      { id: "accent", name: "Accent", color: "#ffffff" },
    ];

    render(<ColorGroupsEditor colorGroups={twoGroups} onChange={onChange} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Remove color group" })[0]);

    expect(onChange).toHaveBeenCalledWith([{ id: "accent", name: "Accent", color: "#ffffff" }]);
  });
});
