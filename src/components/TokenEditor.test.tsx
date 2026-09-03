// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../hooks/useTokenSpec", () => ({ useTokenSpec: vi.fn() }));

const { useTokenSpec } = await import("../hooks/useTokenSpec");
const { TokenEditor } = await import("./TokenEditor");

describe("TokenEditor", () => {
  it("shows a loading message while resources load", () => {
    vi.mocked(useTokenSpec).mockReturnValue({ status: "loading" } as ReturnType<
      typeof useTokenSpec
    >);

    render(<TokenEditor />);

    expect(screen.getByText("Loading font and icon registry...")).toBeInTheDocument();
  });

  it("shows the error message when loading fails", () => {
    vi.mocked(useTokenSpec).mockReturnValue({
      status: "error",
      errorMessage: "font fetch failed",
    } as ReturnType<typeof useTokenSpec>);

    render(<TokenEditor />);

    expect(screen.getByText("Failed to load: font fetch failed")).toBeInTheDocument();
  });

  it("renders the shape editor with the current spec once ready", () => {
    vi.mocked(useTokenSpec).mockReturnValue({
      status: "ready",
      errorMessage: undefined,
      spec: {
        version: 1,
        shape: { type: "disc", diameterMm: 25 },
        textLayout: "flat",
        lines: [],
        icons: [],
        decorations: [],
        style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
        colorGroups: [],
        printProfileId: "fdm-04",
        fitPolicy: { minTracking: 0, maxTracking: 0, minScale: 1, allowTwoLines: false },
      },
      setSpec: vi.fn(),
      manifest: [],
      plateLayout: { count: 1, columns: 1, spacingMm: 60 },
      setPlateLayout: vi.fn(),
      isValidating: false,
      validation: undefined,
      warnings: [],
      reliefComponents: [],
      exportThreeMf: vi.fn(),
      exportError: undefined,
      exportSpecJson: vi.fn(),
      importSpecJson: vi.fn(),
      importError: undefined,
    } as ReturnType<typeof useTokenSpec>);

    render(<TokenEditor />);

    expect(screen.getByLabelText("Diameter (mm)")).toHaveValue(25);
    expect(screen.getByLabelText("Print profile")).toHaveValue("fdm-04");
  });

  it("does not render the lines editor for a disc shape", () => {
    vi.mocked(useTokenSpec).mockReturnValue({
      status: "ready",
      errorMessage: undefined,
      spec: {
        version: 1,
        shape: { type: "disc", diameterMm: 25 },
        textLayout: "flat",
        lines: [],
        icons: [],
        decorations: [],
        style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
        colorGroups: [],
        printProfileId: "fdm-04",
        fitPolicy: { minTracking: 0, maxTracking: 0, minScale: 1, allowTwoLines: false },
      },
      setSpec: vi.fn(),
      manifest: [],
      plateLayout: { count: 1, columns: 1, spacingMm: 60 },
      setPlateLayout: vi.fn(),
      isValidating: false,
      validation: undefined,
      warnings: [],
      reliefComponents: [],
      exportThreeMf: vi.fn(),
      exportError: undefined,
      exportSpecJson: vi.fn(),
      importSpecJson: vi.fn(),
      importError: undefined,
    } as ReturnType<typeof useTokenSpec>);

    render(<TokenEditor />);

    expect(screen.queryByRole("group", { name: "Lines" })).not.toBeInTheDocument();
  });
});
