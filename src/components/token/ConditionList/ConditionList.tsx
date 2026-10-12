import { CatalogCondition } from "../../../core/token/catalog/catalogTypes";
import { CounterSelection, MIN_COPIES } from "../../../core/token/catalog/tokenItems/tokenItem";
import { CounterPanel, CounterRow } from "../CounterPanel/CounterPanel";

type ConditionListProps = {
  conditions: CatalogCondition[];
  selection: Record<string, CounterSelection>;
  onSelectionChange: (selection: Record<string, CounterSelection>) => void;
};

const MAX_CONDITION_COPIES = 12;
const DEFAULT_CONDITION_COUNTER: CounterSelection = { enabled: false, copies: MIN_COPIES };

export const ConditionList = ({ conditions, selection, onSelectionChange }: ConditionListProps) => {
  const rows: CounterRow[] = conditions.map((condition) => ({
    key: condition.id,
    label: condition.name,
    selection: selection[condition.id] ?? DEFAULT_CONDITION_COUNTER,
    onChange: (rowSelection) => onSelectionChange({ ...selection, [condition.id]: rowSelection }),
    maxCopies: MAX_CONDITION_COPIES,
  }));

  // Every row targets the same record, so they are written in one call: calling each row's own
  // onChange in a loop would build every one on this render's stale snapshot.
  const toggleAll = (enabled: boolean) => {
    const nextSelection = { ...selection };

    for (const row of rows) {
      nextSelection[row.key] = { ...row.selection, enabled };
    }

    onSelectionChange(nextSelection);
  };

  return <CounterPanel title="Conditions" rows={rows} onToggleAll={toggleAll} />;
};
