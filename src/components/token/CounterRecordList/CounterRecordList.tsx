import { CounterSelection, MIN_COPIES } from "../../../core/token/catalog/tokenItems/tokenItem";
import { CounterPanel, CounterRow } from "../CounterPanel/CounterPanel";

// The part of a catalog entry this list needs: conditions and game plans both fit it.
export type CounterRecordEntry = {
  id: string;
  name: string;
  maxCopies?: number;
};

type CounterRecordListProps = {
  title: string;
  entries: CounterRecordEntry[];
  // The cap for an entry that sets no maxCopies of its own.
  maxCopies: number;
  selection: Record<string, CounterSelection>;
  onSelectionChange: (selection: Record<string, CounterSelection>) => void;
};

const DEFAULT_COUNTER: CounterSelection = { enabled: false, copies: MIN_COPIES };

// A counter panel over a selection record keyed by entry id (conditions, game plans).
export const CounterRecordList = ({
  title,
  entries,
  maxCopies,
  selection,
  onSelectionChange,
}: CounterRecordListProps) => {
  const rows: CounterRow[] = entries.map((entry) => ({
    key: entry.id,
    label: entry.name,
    selection: selection[entry.id] ?? DEFAULT_COUNTER,
    onChange: (rowSelection) => onSelectionChange({ ...selection, [entry.id]: rowSelection }),
    maxCopies: entry.maxCopies ?? maxCopies,
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

  return <CounterPanel title={title} rows={rows} onToggleAll={toggleAll} />;
};
