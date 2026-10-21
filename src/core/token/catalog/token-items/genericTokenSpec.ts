import type { TokenSpec } from "../../types";
import type { CatalogGenericToken } from "../catalogTypes";
import { buildCrestDiscTokenSpec } from "./crestDiscTokenSpec";
import type { SharedConfig } from "./tokenItem";

export const buildGenericTokenSpec = (
  generic: CatalogGenericToken,
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec => {
  const iconId = generic.iconId ?? guildIconId;

  return buildCrestDiscTokenSpec(
    iconId,
    guildIconId,
    guildIconScale,
    sharedConfig,
  );
};
