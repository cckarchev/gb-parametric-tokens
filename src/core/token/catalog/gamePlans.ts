import gamePlansData from "@/data/gamePlans.json";

import type { CatalogGamePlan } from "./catalogTypes";

// Only the Game Plan cards (gameplans-2025) whose effect lingers on a model or
// terrain piece for the turn, so a token on the table is worth having. Cards
// that resolve on the spot, or buff the whole team, have nothing to mark.
export const gamePlans: CatalogGamePlan[] = gamePlansData;
