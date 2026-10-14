import { TEXT_COLOR_GROUP_ID } from "../../mesh/colorGroups";
import { FitPolicy, IconSpec, TokenSpec } from "../../types";
import { SharedConfig } from "./tokenItem";

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
//
// fitPolicyOverride exists for a token whose text is fixed by this app rather than typed by the
// user, and so never needs fitting at all (Momentum's "MP", see momentumTokenSpec.ts). It's a
// parameter rather than a field the caller re-assigns after the spread, so the override is
// visible at the call site instead of depending on which key happens to be written last.
export const sharedTokenFields = (
  sharedConfig: SharedConfig,
  fitPolicyOverride?: FitPolicy,
): Pick<TokenSpec, "style" | "colorGroups" | "printProfileId" | "fitPolicy"> => {
  return {
    style: sharedConfig.style,
    colorGroups: sharedConfig.colorGroups,
    printProfileId: sharedConfig.printProfileId,
    fitPolicy: fitPolicyOverride ?? sharedConfig.fitPolicy,
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
