import type { AvailableGuild } from "@/browser/listAvailableGuilds";

import styles from "./GuildSelector.module.css";

type GuildTileProps = {
  guild: AvailableGuild;
  onSelect: (guildId: string) => void;
  // Swaps the two colors: the badge takes the guild color and the crest goes
  // paper white. For a crest too dark to sit on the white badge without
  // blending into the dark tile around it.
  inverted?: boolean;
};

// Crest size as a percentage of the tile, right for most guilds. A guild whose
// crest still reads small or large sets an iconScale that multiplies it.
const LOGO_BASE_SIZE_PERCENT = 80;
const DEFAULT_ICON_SCALE = 1;
const PAPER_COLOR = "var(--color-paper)";

export const GuildTile = ({
  guild,
  onSelect,
  inverted = false,
}: GuildTileProps) => {
  const logoSizePercent =
    LOGO_BASE_SIZE_PERCENT * (guild.iconScale ?? DEFAULT_ICON_SCALE);
  const logoUrl = `url(/icons/guilds/${guild.name}/logo.svg)`;
  const badgeColor = inverted ? guild.color : PAPER_COLOR;
  const logoColor = inverted ? PAPER_COLOR : guild.color;

  return (
    <button
      type="button"
      className={styles.tile}
      title={guild.name}
      onClick={() => onSelect(guild.id)}
    >
      {/* The logo files are solid black and an <img> can't be recolored, so the
          crest is a CSS mask painted in the guild's color, over a white backing
          circle (or the reverse, when inverted). */}
      <span className={styles.badgeStack}>
        <span
          className={styles.badge}
          style={{ backgroundColor: badgeColor }}
        />
        <span
          className={styles.logo}
          style={{
            backgroundColor: logoColor,
            maskImage: logoUrl,
            // biome-ignore lint/style/useNamingConvention: React names the -webkit-mask-image property this way.
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
