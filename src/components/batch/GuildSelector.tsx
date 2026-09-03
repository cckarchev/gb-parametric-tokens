import { AvailableGuild } from "../../browser/listAvailableGuilds";
import { SelectField } from "../primitives/SelectField";

export type GuildSelectorProps = {
  guilds: AvailableGuild[];
  selectedGuildId?: string;
  onSelect: (guildId: string) => void;
};

const NO_GUILD_SELECTED_VALUE = "";

export const GuildSelector = ({ guilds, selectedGuildId, onSelect }: GuildSelectorProps) => {
  const guildOptions = guilds.map((guild) => ({ value: guild.id, label: guild.name }));

  // With `selectedGuildId` unset, the select's value falls back to the empty string. Without a
  // matching empty option here, the browser silently displays the first real guild as if it were
  // selected, and clicking that already-shown option never fires onChange (the value never
  // actually changes), so a guild picked this way never reaches `onSelect`.
  const options =
    selectedGuildId === undefined && guildOptions.length > 0
      ? [{ value: NO_GUILD_SELECTED_VALUE, label: "Select a guild..." }, ...guildOptions]
      : guildOptions;

  return (
    <SelectField
      label="Guild"
      value={selectedGuildId ?? NO_GUILD_SELECTED_VALUE}
      options={options}
      onChange={onSelect}
    />
  );
};
