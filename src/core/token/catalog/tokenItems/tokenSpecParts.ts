import { IconSpec, TokenSpec } from "../../types";
import { TEXT_COLOR_GROUP_ID } from "../deriveReliefColor";
import { SharedConfig } from "./tokenItem";

export const DEFAULT_ICON_SCALE = 0.85;

// Every icon a guild token wears goes through here, so iconOverflowBehavior only needs to be
// threaded once: when it's "none" (the default), the built IconSpec looks exactly as it always
// has, so no overflow correction ever runs even though it's still flagged for attention.
export const buildIconSpec = (
  iconId: string,
  side: IconSpec["side"],
  scale: number,
  sharedConfig: SharedConfig,
): IconSpec => ({
  iconId,
  side,
  scale,
  colorGroup: TEXT_COLOR_GROUP_ID,
  ...(sharedConfig.iconOverflowBehavior !== "none"
    ? { overflowBehavior: sharedConfig.iconOverflowBehavior }
    : {}),
});

// Every token spec carries the same trailing style/printing fields from the shared config,
// whatever its own shape, text, icons, and decorations look like.
export const sharedTokenFields = (
  sharedConfig: SharedConfig,
): Pick<TokenSpec, "style" | "colorGroups" | "printProfileId" | "fitPolicy"> => {
  return {
    style: sharedConfig.style,
    colorGroups: sharedConfig.colorGroups,
    printProfileId: sharedConfig.printProfileId,
    fitPolicy: sharedConfig.fitPolicy,
  };
};

// The catalog's iconScale (see GuildCatalog) only makes sense for the guild's own crest, so a
// token wearing a custom icon of its own is left at the plain default.
export const guildCrestScale = (
  iconId: string,
  guildIconId: string,
  guildIconScale: number,
): number => {
  return iconId === guildIconId ? guildIconScale : 1;
};
