import { GuildCatalog } from "@/core/token/catalog/catalogTypes";
import { CounterSelection, MIN_COPIES } from "@/core/token/catalog/tokenItems/tokenItem";

import { CounterPanel, CounterRow } from "../counter-panel/CounterPanel";

type GuildTokenListProps = {
  catalog: GuildCatalog;
  genericTokens: Record<string, CounterSelection>;
  onGenericTokensChange: (genericTokens: Record<string, CounterSelection>) => void;
  influence: CounterSelection;
  onInfluenceChange: (influence: CounterSelection) => void;
  momentum: CounterSelection;
  onMomentumChange: (momentum: CounterSelection) => void;
  goalInfluence: CounterSelection;
  onGoalInfluenceChange: (goalInfluence: CounterSelection) => void;
};

const MAX_COPIES = 20;
const MAX_GOAL_INFLUENCE_COPIES = 2;
const DEFAULT_GENERIC_COUNTER: CounterSelection = { enabled: false, copies: MIN_COPIES };

export const GuildTokenList = ({
  catalog,
  genericTokens,
  onGenericTokensChange,
  influence,
  onInfluenceChange,
  momentum,
  onMomentumChange,
  goalInfluence,
  onGoalInfluenceChange,
}: GuildTokenListProps) => {
  const fixedRows: CounterRow[] = [
    {
      key: "influence",
      label: "Influence tokens",
      selection: influence,
      onChange: onInfluenceChange,
      maxCopies: MAX_COPIES,
    },
    {
      key: "momentum",
      label: "Momentum tokens",
      selection: momentum,
      onChange: onMomentumChange,
      maxCopies: MAX_COPIES,
    },
    {
      key: "goalInfluence",
      label: "Goal Influence tokens",
      selection: goalInfluence,
      onChange: onGoalInfluenceChange,
      maxCopies: MAX_GOAL_INFLUENCE_COPIES,
    },
  ];

  const genericRows: CounterRow[] = catalog.genericTokens.map((generic) => ({
    key: generic.name,
    label: generic.name,
    selection: genericTokens[generic.name] ?? DEFAULT_GENERIC_COUNTER,
    onChange: (selection) => onGenericTokensChange({ ...genericTokens, [generic.name]: selection }),
    maxCopies: generic.maxCopies ?? MAX_COPIES,
  }));

  const rows = [...fixedRows, ...genericRows];

  // Only ever flips `enabled` -- every counter's own copies count (default or already chosen)
  // is left exactly as it was, on or off, so toggling this twice in a row is a no-op on the
  // numbers themselves.
  //
  // The generics are written in one batched call rather than through their own per-row onChange:
  // those all target the same `genericTokens` record, so calling them in a loop would have each
  // one build on this render's stale snapshot and only the last would survive.
  const toggleAll = (enabled: boolean) => {
    for (const row of fixedRows) {
      row.onChange({ ...row.selection, enabled });
    }

    const nextGenericTokens = { ...genericTokens };

    for (const row of genericRows) {
      nextGenericTokens[row.key] = { ...row.selection, enabled };
    }

    onGenericTokensChange(nextGenericTokens);
  };

  return <CounterPanel title="Guild tokens" rows={rows} onToggleAll={toggleAll} />;
};
