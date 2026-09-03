// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PlateLayout } from "../../../core/token/geometry/computePlateOffsets";
import { PlateEditor } from "./PlateEditor";

const baseLayout: PlateLayout = { count: 4, columns: 2, spacingMm: 5 };

describe("PlateEditor", () => {
  it("renders the current plate values", () => {
    render(<PlateEditor plateLayout={baseLayout} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Copies")).toHaveValue(4);
    expect(screen.getByLabelText("Columns")).toHaveValue(2);
    expect(screen.getByLabelText("Spacing (mm)")).toHaveValue(5);
  });

  it("reports a copies change while preserving the rest of the layout", () => {
    const onChange = vi.fn();

    render(<PlateEditor plateLayout={baseLayout} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Copies"), { target: { value: "6" } });

    expect(onChange).toHaveBeenCalledWith({ ...baseLayout, count: 6 });
  });
});
