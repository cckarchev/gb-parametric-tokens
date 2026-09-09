// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../hooks/useBatch", () => ({ useBatch: vi.fn() }));

const { useBatch } = await import("../../../hooks/useBatch");
const { BatchEditor } = await import("./BatchEditor");

const baseBatch = {
  guilds: [{ id: "brewers", name: "Brewers", color: "#cdb320" }],
  selectedGuildId: undefined,
  selectGuild: vi.fn(),
  catalogStatus: "idle",
  catalogError: undefined,
  catalog: undefined,
  selection: {
    characterTokenIds: [],
    genericCopies: {},
    influenceCopies: 0,
    momentumCopies: 0,
    goalInfluenceCopies: 0,
  },
  setSelection: vi.fn(),
  sharedConfig: {
    printProfileId: "fdm-04",
    arcShape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, nobDiameterMm: 24 },
    discShape: { type: "disc", diameterMm: 25 },
    goalInfluenceShape: { type: "disc", diameterMm: 20 },
    style: { relief: "raised", reliefHeightMm: 0.6, baseThicknessMm: 3 },
    fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
    colorGroups: [],
  },
  setSharedConfig: vi.fn(),
  previewItems: [],
  isPreviewing: false,
  validCount: 0,
  invalidCount: 0,
  isExporting: false,
  exportError: undefined,
  exportFailures: [],
  exportThreeMf: vi.fn(),
  exportSettingsJson: vi.fn(),
  importSettingsJson: vi.fn(),
  importSettingsError: undefined,
} as unknown as ReturnType<typeof useBatch>;

describe("BatchEditor", () => {
  it("shows the guild selector but not the catalog sections when no catalog is loaded", () => {
    vi.mocked(useBatch).mockReturnValue(baseBatch);

    render(<BatchEditor />);

    expect(screen.getByLabelText("Guild")).toBeInTheDocument();
    expect(screen.queryByLabelText("Influence tokens (0-20)")).not.toBeInTheDocument();
  });

  it("shows a loading message while the catalog loads", () => {
    vi.mocked(useBatch).mockReturnValue({ ...baseBatch, catalogStatus: "loading" });

    render(<BatchEditor />);

    expect(screen.getByText("Loading catalog...")).toBeInTheDocument();
  });

  it("shows the catalog error message", () => {
    vi.mocked(useBatch).mockReturnValue({
      ...baseBatch,
      catalogStatus: "error",
      catalogError: "Not Found",
    });

    render(<BatchEditor />);

    expect(screen.getByText("Failed to load catalog: Not Found")).toBeInTheDocument();
  });

  it("renders the catalog-dependent sections once a catalog is loaded", () => {
    vi.mocked(useBatch).mockReturnValue({
      ...baseBatch,
      catalogStatus: "ready",
      catalog: {
        guildId: "brewers",
        name: "Brewers",
        color: "#cdb320",
        characters: [{ id: "tapper", name: "Tapper", tokens: [{ title: "Commanding Aura" }] }],
        genericTokens: [{ id: "beer-token", name: "Beer Token" }],
      },
    });

    render(<BatchEditor />);

    expect(screen.getByLabelText("Influence tokens (0-20)")).toBeInTheDocument();
    expect(screen.getByLabelText("Momentum tokens (0-20)")).toBeInTheDocument();
    expect(screen.getByLabelText("Beer Token")).toBeInTheDocument();
  });
});
