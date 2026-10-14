import { GuildCatalog } from "@/core/token/catalog/catalogTypes";
import { CounterSelection, DISABLED_COUNTER } from "@/core/token/catalog/token-items/tokenItem";

import { CounterPanel, CounterRow } from "./counter-panel/CounterPanel";
import { setRowsEnabled } from "./setRowsEnabled";

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
    selection: genericTokens[generic.name] ?? DISABLED_COUNTER,
    onChange: (selection) => onGenericTokensChange({ ...genericTokens, [generic.name]: selection }),
    maxCopies: generic.maxCopies ?? MAX_COPIES,
  }));

  const rows = [...fixedRows, ...genericRows];

  // Only ever flips `enabled`: every counter's own copies count (default or already chosen)
  // is left exactly as it was, on or off, so toggling this twice in a row is a no-op on the
  // numbers themselves.
  //
  // The generics all live in the one `genericTokens` record, so they go through setRowsEnabled.
  const toggleAll = (enabled: boolean) => {
    for (const row of fixedRows) {
      row.onChange({ ...row.selection, enabled });
    }

    onGenericTokensChange(setRowsEnabled(genericTokens, genericRows, enabled));
  };

  return <CounterPanel title="Guild tokens" rows={rows} onToggleAll={toggleAll} />;
};
