import { TEXT_COLOR_GROUP_ID } from "../../mesh/colorGroups";
import type { FitPolicy, IconSpec, TokenSpec } from "../../types";
import type { SharedConfig } from "./tokenItem";

// Every icon a guild token wears is built here, so iconOverflowBehavior is applied in one place.
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
  ...(sharedConfig.iconOverflowBehavior === "none"
    ? {}
    : { overflowBehavior: sharedConfig.iconOverflowBehavior }),
});

// The style and printing fields every token spec takes from the shared config.
//
// fitPolicyOverride is for fixed text that never needs fitting (Momentum's "MP"). A parameter,
// rather than a key written after the spread, keeps the override visible at the call site.
export const sharedTokenFields = (
  sharedConfig: SharedConfig,
  fitPolicyOverride?: FitPolicy,
): Pick<
  TokenSpec,
  "style" | "colorGroups" | "printProfileId" | "fitPolicy"
> => ({
  style: sharedConfig.style,
  colorGroups: sharedConfig.colorGroups,
  printProfileId: sharedConfig.printProfileId,
  fitPolicy: fitPolicyOverride ?? sharedConfig.fitPolicy,
});

// The catalog's iconScale (see GuildCatalog) only makes sense for the guild's own crest, so a
// token wearing a custom icon of its own is left at the plain default.
export const guildCrestScale = (
  iconId: string,
  guildIconId: string,
  guildIconScale: number,
): number => (iconId === guildIconId ? guildIconScale : 1);
