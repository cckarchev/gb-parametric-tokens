// @vitest-environment happy-dom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BatchSelection } from "../../../core/token/catalog/buildBatchItems";

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
    characterTokenCopies: {},
    genericTokens: {},
    influence: { enabled: false, copies: 1 },
    momentum: { enabled: false, copies: 1 },
    goalInfluence: { enabled: false, copies: 1 },
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

    expect(screen.getByRole("group", { name: "Guild" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Influence tokens")).not.toBeInTheDocument();
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

    expect(screen.getByLabelText("Influence tokens")).toBeInTheDocument();
    expect(screen.getByLabelText("Momentum tokens")).toBeInTheDocument();
    expect(screen.getByLabelText("Beer Token")).toBeInTheDocument();
  });

  it("composes every field update from Guild tokens' own Select all instead of only the last one sticking (regression)", () => {
    // Real bug, caught by the user: GuildTokenList's "Select all" fires onInfluenceChange,
    // onMomentumChange, onGoalInfluenceChange, and onGenericTokensChange synchronously in one
    // click. If any of those handlers builds its next selection from the `batch.selection`
    // snapshot this render closed over (`{ ...batch.selection, field }`) instead of from
    // whatever the previous call in the same click just produced, only the last of the four
    // calls actually took effect -- the checkbox looked like it did nothing for the other three
    // fields. Each call here is captured and replayed in order to prove they compose.
    const setSelection = vi.fn();

    vi.mocked(useBatch).mockReturnValue({
      ...baseBatch,
      catalogStatus: "ready",
      catalog: {
        guildId: "brewers",
        name: "Brewers",
        color: "#cdb320",
        characters: [],
        genericTokens: [{ id: "beer-token", name: "Beer Token" }],
      },
      setSelection,
    });

    render(<BatchEditor />);

    const guildTokensPanel = screen.getByText("Guild tokens").closest("fieldset");

    fireEvent.click(within(guildTokensPanel!).getByLabelText("Select all"));

    expect(setSelection).toHaveBeenCalledTimes(4);

    const finalSelection = setSelection.mock.calls.reduce((selection: BatchSelection, call) => {
      const update = call[0] as BatchSelection | ((current: BatchSelection) => BatchSelection);

      return typeof update === "function" ? update(selection) : update;
    }, baseBatch.selection);

    expect(finalSelection.influence.enabled).toBe(true);
    expect(finalSelection.momentum.enabled).toBe(true);
    expect(finalSelection.goalInfluence.enabled).toBe(true);
    expect(finalSelection.genericTokens["beer-token"]?.enabled).toBe(true);
  });
});
