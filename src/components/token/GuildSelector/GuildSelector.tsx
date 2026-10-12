import { AvailableGuild } from "../../../browser/listAvailableGuilds";
import { GENERIC_CATALOG_ID } from "../../../core/token/catalog/genericCatalog";
import styles from "./GuildSelector.module.css";
import { GuildTile } from "./GuildTile";

type GuildSelectorProps = {
  guilds: AvailableGuild[];
  onSelect: (guildId: string) => void;
};

// The home screen: shown only while no guild is open (the header's logo brings it back), so it
// needs no collapsing or selected state of its own. The generic catalog is not a guild, so it
// gets its own group below the guild grid instead of a tile among them.
export const GuildSelector = ({ guilds, onSelect }: GuildSelectorProps) => {
  const guildEntries = guilds.filter((guild) => guild.id !== GENERIC_CATALOG_ID);
  const genericEntries = guilds.filter((guild) => guild.id === GENERIC_CATALOG_ID);
  const hasGenericEntries = genericEntries.length > 0;

  return (
    <section className={styles.home}>
      <div role="group" aria-label="Guilds" className={styles.grid}>
        {guildEntries.map((guild) => (
          <GuildTile key={guild.id} guild={guild} onSelect={onSelect} />
        ))}
      </div>

      {hasGenericEntries && (
        <div role="group" aria-label="Not tied to a guild" className={styles.genericGroup}>
          {genericEntries.map((guild) => (
            <GuildTile key={guild.id} guild={guild} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
};
