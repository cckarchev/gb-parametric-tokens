// @vitest-environment happy-dom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TokenSelection } from "../../../core/token/catalog/tokenItems/tokenItem";

vi.mock("../../../hooks/useTokenGenerator", () => ({ useTokenGenerator: vi.fn() }));

const { useTokenGenerator } = await import("../../../hooks/useTokenGenerator");
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
    printProfileId: "fdm-04",
    arcShape: { type: "arc", ribbonWidthMm: 15, ribbonLengthMm: 20, studDiameterMm: 24 },
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
  it("shows the guild selector but not the catalog sections when no catalog is loaded", () => {
    vi.mocked(useTokenGenerator).mockReturnValue(baseGenerator);

    render(<TokenEditor />);

    expect(screen.getByRole("group", { name: "Guild" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Influence tokens")).not.toBeInTheDocument();
  });

  it("shows the catalog error message", () => {
    vi.mocked(useTokenGenerator).mockReturnValue({
      ...baseGenerator,
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
    // Real bug, caught by the user: GuildTokenList's "Select all" fires onInfluenceChange,
    // onMomentumChange, onGoalInfluenceChange, and onGenericTokensChange synchronously in one
    // click. If any of those handlers builds its next selection from the `generator.selection`
    // snapshot this render closed over (`{ ...generator.selection, field }`) instead of from
    // whatever the previous call in the same click just produced, only the last of the four
    // calls actually took effect -- the checkbox looked like it did nothing for the other three
    // fields. Each call here is captured and replayed in order to prove they compose.
    const setSelection = vi.fn();

    vi.mocked(useTokenGenerator).mockReturnValue({
      ...baseGenerator,
      catalogStatus: "ready",
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
