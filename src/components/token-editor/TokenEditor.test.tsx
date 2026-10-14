// @vitest-environment happy-dom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_SHARED_CONFIG } from "@/core/token/catalog/token-items/defaultSharedConfig";
import { TokenSelection } from "@/core/token/catalog/token-items/tokenItem";

vi.mock("@/hooks/useTokenGenerator", () => ({ useTokenGenerator: vi.fn() }));

const { useTokenGenerator } = await import("@/hooks/useTokenGenerator");
const { TokenEditor } = await import("./TokenEditor");

const baseGenerator = {
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
    conditions: {},
    gamePlans: {},
  },
  setSelection: vi.fn(),
  sharedConfig: {
    ...DEFAULT_SHARED_CONFIG,
    printProfileId: "fdm-04",
    arcShape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, studDiameterMm: 24 },
    discShape: { type: "disc", diameterMm: 25 },
    fitPolicy: { minTracking: 0, maxTracking: 0.3, minScale: 0.7, allowTwoLines: true },
    colorGroups: [],
  },
  setSharedConfig: vi.fn(),
  previewItems: [],
  isPreviewing: false,
  validCount: 0,
  invalidCount: 0,
  invalidPreviewItems: [],
  isExporting: false,
  exportError: undefined,
  exportFailures: [],
  exportThreeMf: vi.fn(),
  exportSettingsJson: vi.fn(),
  importSettingsJson: vi.fn(),
  importSettingsError: undefined,
} as unknown as ReturnType<typeof useTokenGenerator>;

describe("TokenEditor", () => {
  it("shows only the guild selector while no guild is open", () => {
    vi.mocked(useTokenGenerator).mockReturnValue(baseGenerator);

    render(<TokenEditor />);

    expect(screen.getByRole("group", { name: "Guilds" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Influence tokens")).not.toBeInTheDocument();
  });

  it("hides the guild selector once a guild is open", () => {
    vi.mocked(useTokenGenerator).mockReturnValue({
      ...baseGenerator,
      selectedGuildId: "brewers",
      catalogStatus: "ready",
      catalog: {
        guildId: "brewers",
        name: "Brewers",
        color: "#cdb320",
        characters: [],
        genericTokens: [],
        conditions: [],
        appliedConditionIds: [],
        gamePlans: [],
      },
    });

    render(<TokenEditor />);

    expect(screen.queryByRole("group", { name: "Guilds" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Influence tokens")).toBeInTheDocument();
  });

  it("shows the catalog error message", () => {
    vi.mocked(useTokenGenerator).mockReturnValue({
      ...baseGenerator,
      selectedGuildId: "brewers",
      catalogStatus: "error",
      catalogError: "Not Found",
    });

    render(<TokenEditor />);

    expect(screen.getByText("Failed to load catalog: Not Found")).toBeInTheDocument();
  });

  it("renders the catalog-dependent sections once a catalog is loaded", () => {
    vi.mocked(useTokenGenerator).mockReturnValue({
      ...baseGenerator,
      catalogStatus: "ready",
      selectedGuildId: "brewers",
      catalog: {
        guildId: "brewers",
        name: "Brewers",
        color: "#cdb320",
        characters: [{ name: "Tapper", effects: ["commandingAura"] }],
        genericTokens: [{ name: "Beer Token" }],
        conditions: [],
        appliedConditionIds: [],
        gamePlans: [],
      },
    });

    render(<TokenEditor />);

    expect(screen.getByLabelText("Influence tokens")).toBeInTheDocument();
    expect(screen.getByLabelText("Momentum tokens")).toBeInTheDocument();
    expect(screen.getByLabelText("Beer Token")).toBeInTheDocument();
    expect(screen.getByText("Character tokens")).toBeInTheDocument();
    expect(screen.queryByText("Game Plans")).not.toBeInTheDocument();
  });

  it("shows game plans and hides the empty character list for a catalog with no roster", () => {
    vi.mocked(useTokenGenerator).mockReturnValue({
      ...baseGenerator,
      catalogStatus: "ready",
      selectedGuildId: "generic",
      catalog: {
        guildId: "generic",
        name: "Generic",
        color: "#4a4a4a",
        characters: [],
        genericTokens: [],
        conditions: [],
        appliedConditionIds: [],
        gamePlans: [{ id: "extraShot", name: "Extra Shot", effect: "+1 TAC, free Sprint" }],
      },
    });

    render(<TokenEditor />);

    expect(screen.queryByText("Character tokens")).not.toBeInTheDocument();
    expect(screen.getByText("Game Plans")).toBeInTheDocument();
    expect(screen.getByLabelText("Extra Shot")).toBeInTheDocument();
  });

  it("composes every field update from Guild tokens' own Select all instead of only the last one sticking (regression)", () => {
    // "Select all" fires four field updates in one click. Replaying the captured updates in
    // order proves each builds on the previous one rather than on this render's snapshot.
    const setSelection = vi.fn();

    vi.mocked(useTokenGenerator).mockReturnValue({
      ...baseGenerator,
      catalogStatus: "ready",
      selectedGuildId: "brewers",
      catalog: {
        guildId: "brewers",
        name: "Brewers",
        color: "#cdb320",
        characters: [],
        genericTokens: [{ name: "Beer Token" }],
        conditions: [],
        appliedConditionIds: [],
        gamePlans: [],
      },
      setSelection,
    });

    render(<TokenEditor />);

    const guildTokensPanel = screen.getByText("Guild tokens").closest("fieldset");

    fireEvent.click(within(guildTokensPanel!).getByLabelText("Select all"));

    expect(setSelection).toHaveBeenCalledTimes(4);

    const finalSelection = setSelection.mock.calls.reduce((selection: TokenSelection, call) => {
      const update = call[0] as TokenSelection | ((current: TokenSelection) => TokenSelection);

      return typeof update === "function" ? update(selection) : update;
    }, baseGenerator.selection);

    expect(finalSelection.influence.enabled).toBe(true);
    expect(finalSelection.momentum.enabled).toBe(true);
    expect(finalSelection.goalInfluence.enabled).toBe(true);
    expect(finalSelection.genericTokens["Beer Token"]?.enabled).toBe(true);
  });
});
