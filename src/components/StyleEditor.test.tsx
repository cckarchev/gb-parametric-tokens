// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { StyleSpec } from "../core/token/types";
import { StyleEditor } from "./StyleEditor";

const baseStyle: StyleSpec = { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 };

describe("StyleEditor", () => {
  it("renders the current style values", () => {
    render(<StyleEditor style={baseStyle} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Relief")).toHaveValue("raised");
    expect(screen.getByLabelText("Relief height (mm)")).toHaveValue(0.6);
    expect(screen.getByLabelText("Base thickness (mm)")).toHaveValue(3);
  });

  it("reports a relief change while preserving the rest of the style", async () => {
    const onChange = vi.fn();

    render(<StyleEditor style={baseStyle} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText("Relief"), "Engraved");

    expect(onChange).toHaveBeenCalledWith({ ...baseStyle, relief: "engraved" });
  });

  it("reports a base thickness change while preserving the rest of the style", () => {
    const onChange = vi.fn();

    render(<StyleEditor style={baseStyle} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Base thickness (mm)"), { target: { value: "4" } });

    expect(onChange).toHaveBeenCalledWith({ ...baseStyle, baseThicknessMm: 4 });
  });
});
