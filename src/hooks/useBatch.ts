import { useEffect, useState } from "react";

import {
  BatchSelection,
  BatchSharedConfig,
  characterTokenId,
} from "../core/token/catalog/buildBatchItems";
import { GuildCatalog } from "../core/token/catalog/catalogTypes";
import { deriveReliefColor, TEXT_COLOR_GROUP_ID } from "../core/token/catalog/deriveReliefColor";
import {
  DEFAULT_ARC_SHAPE,
  DEFAULT_COLOR_GROUPS,
  DEFAULT_DISC_SHAPE,
  DEFAULT_FIT_POLICY,
  DEFAULT_STYLE,
} from "../core/token/defaultShapeAndStyle";
import { BASE_COLOR_GROUP_ID } from "../core/token/mesh/colorGroups";
import { DEFAULT_PRINT_PROFILE_ID } from "../core/token/printProfiles";
import { useBatchExport } from "./useBatchExport";
import { useBatchPreview } from "./useBatchPreview";
import { useGuildCatalog } from "./useGuildCatalog";

export type { BatchPreviewItem } from "./useBatchWorker";

// Placeholder for influenceIconId before any guild has loaded (selectGuild overwrites it with
// the guild's own icon id). "blank" is a real icon in the manifest, so this never substitutes.
const FALLBACK_ICON_ID = "blank";

const DEFAULT_GOAL_INFLUENCE_SHAPE: BatchSharedConfig["goalInfluenceShape"] = {
  type: "disc",
  diameterMm: 20,
};
// Measured against the real DEFAULT_ARC_SHAPE's 6mm band via the real pipeline
// (computeReliefComponents): the largest sizes that fit a two-line label like "Command" /
// "-2/-2 MOV" without truncating or overlapping the ribbon edges.
const DEFAULT_TITLE_SIZE_MM = 3;
const DEFAULT_SUBTITLE_SIZE_MM = 1.9;

// The counts a batch starts with once a guild loads: picked by the user as sensible starting
// quantities for a game, not a hard limit (every field stays user-editable). Generic tokens
// (e.g. a guild's own "Beer Token") vary in which ones exist per guild, but each starts at the
// same default count.
const DEFAULT_INFLUENCE_COPIES = 13;
const DEFAULT_MOMENTUM_COPIES = 10;
const DEFAULT_GOAL_INFLUENCE_COPIES = 2;
const DEFAULT_GENERIC_COPIES = 6;

const buildDefaultSelection = (): BatchSelection => ({
  characterTokenIds: [],
  genericCopies: {},
  influenceCopies: DEFAULT_INFLUENCE_COPIES,
  momentumCopies: DEFAULT_MOMENTUM_COPIES,
  goalInfluenceCopies: DEFAULT_GOAL_INFLUENCE_COPIES,
});

const buildSelectionForCatalog = (catalog: GuildCatalog): BatchSelection => {
  const allCharacterTokenIds = catalog.characters.flatMap((character) =>
    character.tokens.map((_, tokenIndex) => characterTokenId(character.id, tokenIndex)),
  );
  const defaultGenericCopies = Object.fromEntries(
    catalog.genericTokens.map((generic) => [generic.id, DEFAULT_GENERIC_COPIES]),
  );

  return {
    characterTokenIds: allCharacterTokenIds,
    genericCopies: defaultGenericCopies,
    influenceCopies: DEFAULT_INFLUENCE_COPIES,
    momentumCopies: DEFAULT_MOMENTUM_COPIES,
    goalInfluenceCopies: DEFAULT_GOAL_INFLUENCE_COPIES,
  };
};

export const useBatch = () => {
  const { guilds, selectedGuildId, selectGuild, catalog, catalogStatus, catalogError } =
    useGuildCatalog();

  const [selection, setSelection] = useState<BatchSelection>(buildDefaultSelection());

  const [sharedConfig, setSharedConfig] = useState<BatchSharedConfig>({
    arcShape: DEFAULT_ARC_SHAPE,
    discShape: DEFAULT_DISC_SHAPE,
    goalInfluenceShape: DEFAULT_GOAL_INFLUENCE_SHAPE,
    style: DEFAULT_STYLE,
    fitPolicy: DEFAULT_FIT_POLICY,
    printProfileId: DEFAULT_PRINT_PROFILE_ID,
    colorGroups: DEFAULT_COLOR_GROUPS,
    influenceIconId: FALLBACK_ICON_ID,
    titleSizeMm: DEFAULT_TITLE_SIZE_MM,
    subtitleSizeMm: DEFAULT_SUBTITLE_SIZE_MM,
  });

  // Every successful guild load resets the selection to "everything, at default counts" and
  // seeds the two catalog-derived colors, the same reset buildSelectionForCatalog and this
  // color block used to run inline inside selectGuild's own .then() before the guild-catalog
  // concern moved into useGuildCatalog. Keying off `catalog`'s own identity (a fresh object
  // every load) reproduces that exactly, since loadGuildCatalog never returns a cached object.
  useEffect(() => {
    if (!catalog) {
      return;
    }

    setSelection(buildSelectionForCatalog(catalog));
    setSharedConfig((current) => ({
      ...current,
      influenceIconId: catalog.name,
      colorGroups: [
        { id: BASE_COLOR_GROUP_ID, name: "Body", color: catalog.color },
        {
          id: TEXT_COLOR_GROUP_ID,
          name: "Text & symbols",
          color: deriveReliefColor(catalog.color),
        },
      ],
    }));
  }, [catalog]);

  const {
    batchItems,
    isPreviewing,
    previewItems,
    validCount,
    invalidCount,
    workerRef,
    requestIdRef,
    pendingExportRef,
  } = useBatchPreview(catalog, selection, sharedConfig);

  const { isExporting, exportError, exportFailures, exportZip } = useBatchExport(
    workerRef,
    requestIdRef,
    pendingExportRef,
    batchItems,
    selection,
    sharedConfig,
  );

  return {
    guilds,
    selectedGuildId,
    selectGuild,
    catalog,
    catalogStatus,
    catalogError,
    selection,
    setSelection,
    sharedConfig,
    setSharedConfig,
    batchItems,
    isPreviewing,
    previewItems,
    validCount,
    invalidCount,
    isExporting,
    exportError,
    exportFailures,
    exportZip,
  };
};
