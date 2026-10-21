import type { TokenSpec } from "../../types";
import { buildCrestDiscTokenSpec } from "./crestDiscTokenSpec";
import type { SharedConfig } from "./tokenItem";

// One unnumbered chip, printed as many times as the selection's copies: Influence is counted by
// stacking chips. It wears the guild's crest, so it takes guildIconScale like any other crest.
export const buildInfluenceTokenSpec = (
  guildIconId: string,
  guildIconScale: number,
  sharedConfig: SharedConfig,
): TokenSpec =>
  buildCrestDiscTokenSpec(
    sharedConfig.influenceIconId,
    guildIconId,
    guildIconScale,
    sharedConfig,
  );
