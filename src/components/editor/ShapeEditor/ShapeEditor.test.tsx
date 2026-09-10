// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ShapeSpec } from "../../../core/token/types";
import { ShapeEditor } from "./ShapeEditor";

describe("ShapeEditor", () => {
  it("shows the disc radius field for a disc shape", () => {
    const discShape: ShapeSpec = { type: "disc", diameterMm: 12.5 };

    render(<ShapeEditor shape={discShape} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Diameter (mm)")).toHaveValue(12.5);
    expect(screen.queryByLabelText("Ribbon width (mm)")).not.toBeInTheDocument();
  });

  it("shows the arc fields for an arc shape, with no derived-value fields", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      nobDiameterMm: 24,
    };

    render(<ShapeEditor shape={arcShape} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Ribbon width (mm)")).toHaveValue(15);
    expect(screen.getByLabelText("Ribbon length (mm)")).toHaveValue(20);
    expect(screen.getByLabelText("Nob diameter (mm)")).toHaveValue(24);
    expect(screen.queryByLabelText("Inner radius (mm)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Outer radius (mm)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Sweep (degrees)")).not.toBeInTheDocument();
  });

  it("switches to default arc shape values when the type changes to arc", async () => {
    const onChange = vi.fn();
    const discShape: ShapeSpec = { type: "disc", diameterMm: 12.5 };

    render(<ShapeEditor shape={discShape} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText("Shape type"), "Arc");

    expect(onChange).toHaveBeenCalledWith({
      type: "arc",
      ribbonWidthMm: 6,
      ribbonLengthMm: 30,
      nobDiameterMm: 12,
      nobFilletEnabled: true,
      nobFilletRadiusMm: 3,
    });
  });

  it("reports an updated field while preserving the rest of the arc shape", () => {
    const onChange = vi.fn();
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      nobDiameterMm: 24,
    };

    render(<ShapeEditor shape={arcShape} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Ribbon length (mm)"), { target: { value: "30" } });

    expect(onChange).toHaveBeenCalledWith({ ...arcShape, ribbonLengthMm: 30 });
  });

  it("disables the nob fillet radius field until the fillet is enabled", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      nobDiameterMm: 24,
      nobFilletEnabled: false,
      nobFilletRadiusMm: 2,
    };

    render(<ShapeEditor shape={arcShape} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Nob fillet radius (mm)")).toBeDisabled();
  });

  it("enables the nob fillet radius field once the fillet is on", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      nobDiameterMm: 24,
      nobFilletEnabled: true,
      nobFilletRadiusMm: 2,
    };

    render(<ShapeEditor shape={arcShape} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Nob fillet radius (mm)")).toBeEnabled();
    expect(screen.getByLabelText("Nob fillet radius (mm)")).toHaveValue(2);
  });

  it("reports a nob fillet radius change while preserving the rest of the arc shape", () => {
    const onChange = vi.fn();
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      nobDiameterMm: 24,
      nobFilletEnabled: true,
      nobFilletRadiusMm: 2,
    };

    render(<ShapeEditor shape={arcShape} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Nob fillet radius (mm)"), { target: { value: "3" } });

    expect(onChange).toHaveBeenCalledWith({ ...arcShape, nobFilletRadiusMm: 3 });
  });
});
