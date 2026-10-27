import { useCallback, useMemo, useState } from "react";

import { buildDefaultSelection } from "@/core/token/catalog/buildDefaultSelection";
import type { GuildCatalog } from "@/core/token/catalog/catalogTypes";
import {
  DISABLED_COUNTER,
  type TokenSelection,
} from "@/core/token/catalog/token-items/tokenItem";

// Stands in whenever there is no catalog: no guild selected, or the selected
// guild failed to load. TokenEditor gates every consumer of `selection` behind
// `generator.catalog &&`, so its values are never seen: it exists purely so
// `selection` can stay a plain TokenSelection instead of TokenSelection |
// undefined.
const NO_GUILD_SELECTED: TokenSelection = {
  characterTokenIds: [],
  characterTokenCopies: {},
  genericTokens: {},
  influence: DISABLED_COUNTER,
  momentum: DISABLED_COUNTER,
  goalInfluence: DISABLED_COUNTER,
  conditions: {},
  gamePlans: {},
};

export type SelectionUpdate =
  | TokenSelection
  | ((current: TokenSelection) => TokenSelection);

// One selection per guild, so switching guilds keeps what was chosen. A guild
// gets an entry only once something changes; until then it uses
// defaultSelection below.
export const useGuildSelections = (
  catalog: GuildCatalog | undefined,
  selectedGuildId: string | undefined,
) => {
  const [selectionsByGuild, setSelectionsByGuild] = useState<
    Record<string, TokenSelection>
  >({});

  // Memoized because usePreview watches the selection's identity: a new object
  // on every render would read as a change and request a preview again on every
  // response.
  const defaultSelection = useMemo(
    () => (catalog ? buildDefaultSelection(catalog) : NO_GUILD_SELECTED),
    [catalog],
  );

  const selection =
    selectedGuildId === undefined
      ? NO_GUILD_SELECTED
      : (selectionsByGuild[selectedGuildId] ?? defaultSelection);

  const setSelection = useCallback(
    (update: SelectionUpdate) => {
      if (!catalog || !selectedGuildId) {
        return;
      }

      const guildId = selectedGuildId;

      setSelectionsByGuild((current) => {
        const currentSelection = current[guildId] ?? defaultSelection;
        const nextSelection =
          typeof update === "function" ? update(currentSelection) : update;

        return { ...current, [guildId]: nextSelection };
      });
    },
    [catalog, selectedGuildId, defaultSelection],
  );

  return { selection, setSelection };
};
