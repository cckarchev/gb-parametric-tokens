import { GuildCatalog } from "../../../core/token/catalog/catalogTypes";
import { CounterSelection, MIN_COPIES } from "../../../core/token/catalog/tokenItems/tokenItem";
import { Panel } from "../../primitives/Panel/Panel";
import { SelectAllCheckbox } from "../../primitives/SelectAllCheckbox/SelectAllCheckbox";
import { CounterCountField } from "../CounterCountField/CounterCountField";

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

// One row of this panel, whatever it is backed by: the three counters that every guild has (each
// its own prop) and the guild's own generic tokens (all sharing one record-shaped prop) render
// identically, so they are flattened into one list rather than two parallel blocks of JSX.
type CounterRow = {
  key: string;
  label: string;
  selection: CounterSelection;
  onChange: (selection: CounterSelection) => void;
  maxCopies: number;
};

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
    maxCopies: MAX_COPIES,
  }));

  const rows = [...fixedRows, ...genericRows];
  const allEnabled = rows.every((row) => row.selection.enabled);

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

  return (
    <Panel
      title="Guild tokens"
      headerAccessory={<SelectAllCheckbox checked={allEnabled} onChange={toggleAll} />}>
      {rows.map((row) => (
        <CounterCountField
          key={row.key}
          label={row.label}
          enabled={row.selection.enabled}
          onEnabledChange={(enabled) => row.onChange({ ...row.selection, enabled })}
          copies={row.selection.copies}
          onCopiesChange={(copies) => row.onChange({ ...row.selection, copies })}
          min={MIN_COPIES}
          max={row.maxCopies}
        />
      ))}
    </Panel>
  );
};
