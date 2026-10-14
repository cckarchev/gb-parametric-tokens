// @vitest-environment happy-dom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ShapeSpec } from "@/core/token/types";

import { ShapeEditor } from "./ShapeEditor";

describe("ShapeEditor", () => {
  it("shows the disc diameter field for a disc shape", () => {
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
      studDiameterMm: 24,
    };

    render(<ShapeEditor shape={arcShape} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Ribbon width (mm)")).toHaveValue(15);
    expect(screen.getByLabelText("Ribbon length (mm)")).toHaveValue(20);
    expect(screen.getByLabelText("Stud diameter (mm)")).toHaveValue(24);
    expect(screen.queryByLabelText("Inner radius (mm)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Outer radius (mm)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Sweep (degrees)")).not.toBeInTheDocument();
  });

  it("offers no way to change a shape's type", () => {
    const discShape: ShapeSpec = { type: "disc", diameterMm: 12.5 };

    render(<ShapeEditor shape={discShape} onChange={vi.fn()} />);

    expect(screen.queryByLabelText("Shape type")).not.toBeInTheDocument();
  });

  it("reports an updated disc diameter", () => {
    const onChange = vi.fn();
    const discShape: ShapeSpec = { type: "disc", diameterMm: 12.5 };

    render(<ShapeEditor shape={discShape} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Diameter (mm)"), { target: { value: "20" } });

    expect(onChange).toHaveBeenCalledWith({ type: "disc", diameterMm: 20 });
  });

  it("reports an updated field while preserving the rest of the arc shape", () => {
    const onChange = vi.fn();
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      studDiameterMm: 24,
    };

    render(<ShapeEditor shape={arcShape} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Ribbon length (mm)"), { target: { value: "30" } });

    expect(onChange).toHaveBeenCalledWith({ ...arcShape, ribbonLengthMm: 30 });
  });

  it("disables the stud fillet radius field until the fillet is enabled", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      studDiameterMm: 24,
      studFilletEnabled: false,
      studFilletRadiusMm: 2,
    };

    render(<ShapeEditor shape={arcShape} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Stud fillet radius (mm)")).toBeDisabled();
  });

  it("enables the stud fillet radius field once the fillet is on", () => {
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      studDiameterMm: 24,
      studFilletEnabled: true,
      studFilletRadiusMm: 2,
    };

    render(<ShapeEditor shape={arcShape} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Stud fillet radius (mm)")).toBeEnabled();
    expect(screen.getByLabelText("Stud fillet radius (mm)")).toHaveValue(2);
  });

  it("reports a stud fillet radius change while preserving the rest of the arc shape", () => {
    const onChange = vi.fn();
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      studDiameterMm: 24,
      studFilletEnabled: true,
      studFilletRadiusMm: 2,
    };

    render(<ShapeEditor shape={arcShape} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Stud fillet radius (mm)"), { target: { value: "3" } });

    expect(onChange).toHaveBeenCalledWith({ ...arcShape, studFilletRadiusMm: 3 });
  });

  it("reports the stud fillet toggle while preserving the rest of the arc shape", () => {
    const onChange = vi.fn();
    const arcShape: ShapeSpec = {
      type: "arc",
      ribbonWidthMm: 15,
      ribbonLengthMm: 20,
      studDiameterMm: 24,
      studFilletEnabled: false,
      studFilletRadiusMm: 2,
    };

    render(<ShapeEditor shape={arcShape} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Fillet between stud and arc"));

    expect(onChange).toHaveBeenCalledWith({ ...arcShape, studFilletEnabled: true });
  });
});
