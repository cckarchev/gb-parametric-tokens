import { CounterSelection, DISABLED_COUNTER } from "@/core/token/catalog/tokenItems/tokenItem";

import { CounterPanel, CounterRow } from "./counter-panel/CounterPanel";
import { setRowsEnabled } from "./counter-panel/setRowsEnabled";

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
    selection: selection[entry.id] ?? DISABLED_COUNTER,
    onChange: (rowSelection) => onSelectionChange({ ...selection, [entry.id]: rowSelection }),
    maxCopies: entry.maxCopies ?? maxCopies,
  }));

  const toggleAll = (enabled: boolean) => {
    onSelectionChange(setRowsEnabled(selection, rows, enabled));
  };

  return <CounterPanel title={title} rows={rows} onToggleAll={toggleAll} />;
};
