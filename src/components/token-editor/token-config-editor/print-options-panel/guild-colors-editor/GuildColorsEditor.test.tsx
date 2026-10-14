// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ColorGroupSpec } from "@/core/token/types";

import { GuildColorsEditor } from "./GuildColorsEditor";

const colorGroups: ColorGroupSpec[] = [
  { id: "base", name: "Body", color: "#cdb320" },
  { id: "text", name: "Text & symbols", color: "#000000" },
];

describe("GuildColorsEditor", () => {
  it("shows the body and text colors, with no add/remove controls", () => {
    render(<GuildColorsEditor colorGroups={colorGroups} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Body")).toHaveValue("#cdb320");
    expect(screen.getByLabelText("Details")).toHaveValue("#000000");
    expect(screen.queryByRole("button", { name: "Add color group" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove color group" })).not.toBeInTheDocument();
  });

  it("reports a body color change while preserving the text color group", () => {
    const onChange = vi.fn();

    render(<GuildColorsEditor colorGroups={colorGroups} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "#123456" } });

    expect(onChange).toHaveBeenCalledWith([
      { id: "base", name: "Body", color: "#123456" },
      { id: "text", name: "Text & symbols", color: "#000000" },
    ]);
  });

  it("reports a text color change while preserving the body color group", () => {
    const onChange = vi.fn();

    render(<GuildColorsEditor colorGroups={colorGroups} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Details"), { target: { value: "#abcdef" } });

    expect(onChange).toHaveBeenCalledWith([
      { id: "base", name: "Body", color: "#cdb320" },
      { id: "text", name: "Text & symbols", color: "#abcdef" },
    ]);
  });
});
