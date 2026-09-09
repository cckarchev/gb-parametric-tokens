import { AvailableGuild } from "../../../browser/listAvailableGuilds";
import styles from "./GuildSelector.module.css";

export type GuildSelectorProps = {
  guilds: AvailableGuild[];
  selectedGuildId?: string;
  onSelect: (guildId: string) => void;
};

// Shared logo size, as a percentage of the tile, that already looks right for the vast majority
// of guilds once their SVG's viewBox is cropped to its own ink bounding box (see
// GuildSelector.module.css's .logo comment). A guild's optional iconScale multiplies this base
// for the rare crest that still reads a touch small or large after that normalization.
const LOGO_BASE_SIZE_PERCENT = 80;

export const GuildSelector = ({ guilds, selectedGuildId, onSelect }: GuildSelectorProps) => {
  return (
    <div className={styles.grid} role="group" aria-label="Guild">
      {guilds.map((guild) => {
        const logoSizePercent = LOGO_BASE_SIZE_PERCENT * (guild.iconScale ?? 1);

        return (
          <button
            key={guild.id}
            type="button"
            className={guild.id === selectedGuildId ? styles.tileSelected : styles.tile}
            title={guild.name}
            aria-pressed={guild.id === selectedGuildId}
            onClick={() => onSelect(guild.id)}>
            {/* Near-white badge is just the icon's own backing plate; the icon itself carries the
                guild's color. The logo files are solid-black artwork with no way to recolor an
                <img>, so the silhouette is painted via a CSS mask instead. Every /icons/*.svg has
                its viewBox cropped to its own ink bounding box (see GuildSelector.module.css's
                .logo comment), so a shared base size (LOGO_BASE_SIZE_PERCENT) renders every
                guild at a consistent size with no per-guild tuning needed in the common case.
                .badge and .logo are siblings stacked in the same grid cell (not nested) so their
                sizes are independent: shrinking the white circle does not shrink the icon riding
                on top of it. The guild name is a tooltip (the button's `title`) only, not a
                permanent label. */}
            <span className={styles.badgeStack}>
              <span className={styles.badge} />
              <span
                className={styles.logo}
                style={{
                  backgroundColor: guild.color,
                  maskImage: `url(/icons/${guild.name}.svg)`,
                  WebkitMaskImage: `url(/icons/${guild.name}.svg)`,
                  width: `${logoSizePercent}%`,
                  height: `${logoSizePercent}%`,
                }}
                role="img"
                aria-label={guild.name}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
};
