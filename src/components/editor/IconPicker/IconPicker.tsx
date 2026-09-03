import { IconKind, ManifestEntry } from "../../../core/token/icons/iconManifest";
import styles from "./IconPicker.module.css";

export type IconPickerProps = {
  manifest: ManifestEntry[];
  value: string | undefined;
  onChange: (iconId: string | undefined) => void;
};

const NO_ICON_VALUE = "";

const KIND_LABELS: Record<IconKind, string> = {
  guild: "Guilds",
  status: "Status",
  generic: "Generic",
};

const groupByKind = (manifest: ManifestEntry[]): Map<IconKind, ManifestEntry[]> => {
  const groups = new Map<IconKind, ManifestEntry[]>();

  for (const entry of manifest) {
    const existing = groups.get(entry.kind) ?? [];

    groups.set(entry.kind, [...existing, entry]);
  }

  return groups;
};

export const IconPicker = ({ manifest, value, onChange }: IconPickerProps) => {
  const groups = groupByKind(manifest);

  return (
    <label className={styles.field}>
      <span className={styles.label}>Icon</span>
      <span className={styles.row}>
        <select
          className={styles.input}
          value={value ?? NO_ICON_VALUE}
          onChange={(event) =>
            onChange(event.target.value === NO_ICON_VALUE ? undefined : event.target.value)
          }>
          <option value={NO_ICON_VALUE}>(none)</option>
          {[...groups.entries()].map(([kind, entries]) => (
            <optgroup key={kind} label={KIND_LABELS[kind]}>
              {entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.id}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {value && <img src={`/icons/${value}.svg`} alt={value} width={32} height={32} />}
      </span>
    </label>
  );
};
