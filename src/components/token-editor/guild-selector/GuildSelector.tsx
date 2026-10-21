import type { AvailableGuild } from "@/browser/listAvailableGuilds";
import { GENERIC_CATALOG_ID } from "@/core/token/catalog/genericCatalog";

import styles from "./GuildSelector.module.css";
import { GuildTile } from "./GuildTile";

type GuildSelectorProps = {
  guilds: AvailableGuild[];
  onSelect: (guildId: string) => void;
};

// The home screen: shown only while no guild is open (the header's logo brings it back), so it
// needs no collapsing or selected state of its own. The generic catalog is not a guild, so it
// always closes the grid instead of sorting in among the crests. Its crest is black, so its tile
// is inverted to keep it from sinking into the dark background.
export const GuildSelector = ({ guilds, onSelect }: GuildSelectorProps) => {
  const guildEntries = guilds.filter(
    (guild) => guild.id !== GENERIC_CATALOG_ID,
  );
  const genericEntries = guilds.filter(
    (guild) => guild.id === GENERIC_CATALOG_ID,
  );
  const orderedEntries = [...guildEntries, ...genericEntries];

  return (
    <section>
      <fieldset aria-label="Guilds" className={styles.grid}>
        {orderedEntries.map((guild) => (
          <GuildTile
            key={guild.id}
            guild={guild}
            onSelect={onSelect}
            inverted={guild.id === GENERIC_CATALOG_ID}
          />
        ))}
      </fieldset>
    </section>
  );
};
