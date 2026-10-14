import { AvailableGuild } from "@/browser/listAvailableGuilds";

import styles from "./GuildSelector.module.css";

type GuildTileProps = {
  guild: AvailableGuild;
  onSelect: (guildId: string) => void;
};

// Crest size as a percentage of the tile, right for most guilds. A guild whose crest still reads
// small or large sets an iconScale that multiplies it.
const LOGO_BASE_SIZE_PERCENT = 80;
const DEFAULT_ICON_SCALE = 1;

export const GuildTile = ({ guild, onSelect }: GuildTileProps) => {
  const logoSizePercent = LOGO_BASE_SIZE_PERCENT * (guild.iconScale ?? DEFAULT_ICON_SCALE);
  const logoUrl = `url(/icons/guilds/${guild.name}/logo.svg)`;

  return (
    <button
      type="button"
      className={styles.tile}
      title={guild.name}
      onClick={() => onSelect(guild.id)}>
      {/* The logo files are solid black and an <img> can't be recolored, so the crest is a CSS
          mask painted in the guild's color, over a white backing circle. */}
      <span className={styles.badgeStack}>
        <span className={styles.badge} />
        <span
          className={styles.logo}
          style={{
            backgroundColor: guild.color,
            maskImage: logoUrl,
            WebkitMaskImage: logoUrl,
            width: `${logoSizePercent}%`,
            height: `${logoSizePercent}%`,
          }}
          role="img"
          aria-label={guild.name}
        />
      </span>
    </button>
  );
};
