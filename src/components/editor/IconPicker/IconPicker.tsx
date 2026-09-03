import { IconKind, ManifestEntry } from "../../../core/token/icons/iconManifest";
import { SelectField, SelectFieldEntry } from "../../primitives/SelectField/SelectField";

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

const buildOptions = (manifest: ManifestEntry[]): SelectFieldEntry<string>[] => {
  const entriesByKind = new Map<IconKind, ManifestEntry[]>();

  for (const entry of manifest) {
    const existing = entriesByKind.get(entry.kind) ?? [];

    entriesByKind.set(entry.kind, [...existing, entry]);
  }

  const groups: SelectFieldEntry<string>[] = [...entriesByKind.entries()].map(
    ([kind, entries]) => ({
      groupLabel: KIND_LABELS[kind],
      options: entries.map((entry) => ({ value: entry.id, label: entry.id })),
    }),
  );

  return [{ value: NO_ICON_VALUE, label: "(none)" }, ...groups];
};

export const IconPicker = ({ manifest, value, onChange }: IconPickerProps) => {
  return (
    <SelectField
      label="Icon"
      value={value ?? NO_ICON_VALUE}
      options={buildOptions(manifest)}
      onChange={(newValue) => onChange(newValue === NO_ICON_VALUE ? undefined : newValue)}
      trailing={
        value ? <img src={`/icons/${value}.svg`} alt={value} width={32} height={32} /> : undefined
      }
    />
  );
};
