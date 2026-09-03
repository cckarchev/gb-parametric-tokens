import { zipSync } from "fflate";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  BatchExportResponse,
  BatchPreviewResponse,
  BatchWorkerErrorResponse,
  BatchWorkerItem,
  BatchWorkerRequest,
} from "../browser/batchWorker";
import { downloadBlob } from "../browser/downloadBlob";
import { AvailableGuild, listAvailableGuilds } from "../browser/listAvailableGuilds";
import { loadGuildCatalog } from "../browser/loadGuildCatalog";
import {
  BatchSelection,
  BatchSharedConfig,
  buildBatchItems,
  characterTokenId,
} from "../core/token/catalog/buildBatchItems";
import { GuildCatalog } from "../core/token/catalog/catalogTypes";
import { deriveReliefColor, TEXT_COLOR_GROUP_ID } from "../core/token/catalog/deriveReliefColor";
import { BASE_COLOR_GROUP_ID } from "../core/token/mesh/colorGroups";
import { ReliefComponent } from "../core/token/mesh/reliefComponent";
import { DEFAULT_PRINT_PROFILE_ID } from "../core/token/printProfiles";
import { ShapeSpec } from "../core/token/types";

const DEBOUNCE_MS = 300;
const THREE_MF_FILE_NAME = "batch.3mf";
const SPEC_FILE_NAME = "batch-spec.json";
const ZIP_FILE_NAME = "batch.zip";
const ZIP_MIME_TYPE = "application/zip";
// Placeholder for influenceIconId before any guild has loaded (selectGuild overwrites it with
// the guild's own icon id). "blank" is a real icon in the manifest, so this never substitutes.
const FALLBACK_ICON_ID = "blank";

// Starting point for the new fixed-innerR model (see
// docs/superpowers/specs/2026-09-02-arc-parametrization-design.md) -- not a physical
// measurement, the user adjusts these by feel.
const DEFAULT_ARC_SHAPE: BatchSharedConfig["arcShape"] = {
  type: "arc",
  ribbonWidthMm: 6,
  ribbonLengthMm: 30,
  nobDiameterMm: 12,
};
const DEFAULT_DISC_SHAPE: BatchSharedConfig["discShape"] = { type: "disc", diameterMm: 15 };
const DEFAULT_GOAL_INFLUENCE_SHAPE: BatchSharedConfig["goalInfluenceShape"] = {
  type: "disc",
  diameterMm: 20,
};
const DEFAULT_STYLE: BatchSharedConfig["style"] = {
  relief: "raised",
  reliefHeightMm: 0.6,
  baseThicknessMm: 3,
};
const DEFAULT_FIT_POLICY: BatchSharedConfig["fitPolicy"] = {
  minTracking: -0.3,
  maxTracking: 0,
  minScale: 0.7,
  allowTwoLines: true,
};
const DEFAULT_COLOR_GROUPS: BatchSharedConfig["colorGroups"] = [
  { id: "base", name: "Base", color: "#2B2B2B" },
];
// TEMPORARY: auto-selects Brewers so the batch flow has something loaded on open. Remove once
// there's a real guild picker / persisted last-selected-guild, once more than one guild exists.
const TEMPORARY_DEFAULT_GUILD_ID = "brewers";
// Measured against the real DEFAULT_ARC_SHAPE's 6mm band via the real pipeline
// (computeReliefComponents): the largest sizes that fit a two-line label like "Command" /
// "-2/-2 MOV" without truncating or overlapping the ribbon edges.
const DEFAULT_TITLE_SIZE_MM = 3;
const DEFAULT_SUBTITLE_SIZE_MM = 1.9;

// The counts a batch starts with once a guild loads -- picked by the user as sensible starting
// quantities for a game, not a hard limit (every field stays user-editable). Generic tokens
// (e.g. a guild's own "Beer Token") vary in which ones exist per guild, but each starts at the
// same default count.
const DEFAULT_INFLUENCE_COPIES = 13;
const DEFAULT_MOMENTUM_COPIES = 10;
const DEFAULT_GOAL_INFLUENCE_COPIES = 2;
const DEFAULT_GENERIC_COPIES = 6;

type CatalogStatus = "idle" | "loading" | "ready" | "error";

export type BatchPreviewItem = {
  id: string;
  label: string;
  shape: ShapeSpec;
  baseContours: [number, number][][];
  reliefComponents: ReliefComponent[];
  warnings: string[];
  copies: number;
};

const buildWorkerItems = (batchItems: ReturnType<typeof buildBatchItems>): BatchWorkerItem[] => {
  return batchItems.map((item) => ({
    id: item.id,
    label: item.label,
    spec: item.spec,
    copies: item.copies,
  }));
};

export const useBatch = () => {
  const [guilds, setGuilds] = useState<AvailableGuild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>();
  const [catalog, setCatalog] = useState<GuildCatalog>();
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("idle");
  const [catalogError, setCatalogError] = useState<string>();

  const [selection, setSelection] = useState<BatchSelection>({
    characterTokenIds: [],
    genericCopies: {},
    influenceCopies: DEFAULT_INFLUENCE_COPIES,
    momentumCopies: DEFAULT_MOMENTUM_COPIES,
    goalInfluenceCopies: DEFAULT_GOAL_INFLUENCE_COPIES,
  });

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

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewItems, setPreviewItems] = useState<BatchPreviewItem[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const [exportFailures, setExportFailures] = useState<
    { id: string; label: string; reason: string }[]
  >([]);

  const workerRef = useRef<Worker | undefined>(undefined);
  const requestIdRef = useRef(0);
  const pendingExportRef = useRef<
    | {
        requestId: number;
        resolve: (response: BatchExportResponse) => void;
        reject: (error: Error) => void;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    const worker = new Worker(new URL("../browser/batchWorker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (
      event: MessageEvent<BatchPreviewResponse | BatchExportResponse | BatchWorkerErrorResponse>,
    ) => {
      const response = event.data;

      if (response.kind === "preview") {
        if (response.requestId !== requestIdRef.current) {
          return;
        }

        setPreviewItems(response.results);
        setValidCount(response.validCount);
        setInvalidCount(response.invalidCount);
        setIsPreviewing(false);
        return;
      }

      if (response.kind === "error") {
        if (pendingExportRef.current && pendingExportRef.current.requestId === response.requestId) {
          pendingExportRef.current.reject(new Error(response.message));
          pendingExportRef.current = undefined;
          return;
        }

        if (response.requestId === requestIdRef.current) {
          setIsPreviewing(false);
        }
        return;
      }

      if (pendingExportRef.current && pendingExportRef.current.requestId === response.requestId) {
        pendingExportRef.current.resolve(response);
        pendingExportRef.current = undefined;
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  const selectGuild = useCallback((guildId: string) => {
    setSelectedGuildId(guildId);
    setCatalogStatus("loading");
    setCatalogError(undefined);

    loadGuildCatalog(guildId)
      .then((loadedCatalog) => {
        setCatalog(loadedCatalog);
        setCatalogStatus("ready");

        const allCharacterTokenIds = loadedCatalog.characters.flatMap((character) =>
          character.tokens.map((_, tokenIndex) => characterTokenId(character.id, tokenIndex)),
        );
        const defaultGenericCopies = Object.fromEntries(
          loadedCatalog.genericTokens.map((generic) => [generic.id, DEFAULT_GENERIC_COPIES]),
        );

        setSelection({
          characterTokenIds: allCharacterTokenIds,
          genericCopies: defaultGenericCopies,
          influenceCopies: DEFAULT_INFLUENCE_COPIES,
          momentumCopies: DEFAULT_MOMENTUM_COPIES,
          goalInfluenceCopies: DEFAULT_GOAL_INFLUENCE_COPIES,
        });
        setSharedConfig((current) => ({
          ...current,
          influenceIconId: loadedCatalog.name,
          colorGroups: [
            { id: BASE_COLOR_GROUP_ID, name: "Body", color: loadedCatalog.color },
            {
              id: TEXT_COLOR_GROUP_ID,
              name: "Text & symbols",
              color: deriveReliefColor(loadedCatalog.color),
            },
          ],
        }));
      })
      .catch((error: unknown) => {
        setCatalogStatus("error");
        setCatalogError(error instanceof Error ? error.message : String(error));
      });
  }, []);

  useEffect(() => {
    listAvailableGuilds()
      .then((loadedGuilds) => {
        setGuilds(loadedGuilds);

        const hasTemporaryDefaultGuild = loadedGuilds.some(
          (guild) => guild.id === TEMPORARY_DEFAULT_GUILD_ID,
        );

        if (hasTemporaryDefaultGuild) {
          selectGuild(TEMPORARY_DEFAULT_GUILD_ID);
        }
      })
      .catch((error: unknown) => {
        setCatalogError(error instanceof Error ? error.message : String(error));
      });
    // selectGuild is stable across renders (useCallback with an empty dependency array), so
    // this effect only needs to run once, on mount.
  }, []);

  const batchItems = useMemo(() => {
    if (!catalog) {
      return [];
    }

    return buildBatchItems(catalog, selection, sharedConfig);
  }, [catalog, selection, sharedConfig]);

  useEffect(() => {
    if (!workerRef.current || batchItems.length === 0) {
      setPreviewItems([]);
      setValidCount(0);
      setInvalidCount(0);
      return;
    }

    const requestId = ++requestIdRef.current;

    setIsPreviewing(true);

    const timeoutId = setTimeout(() => {
      const request: BatchWorkerRequest = {
        kind: "preview",
        requestId,
        items: buildWorkerItems(batchItems),
      };

      workerRef.current?.postMessage(request);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [batchItems]);

  const exportZip = useCallback(async () => {
    if (!workerRef.current || batchItems.length === 0) {
      return;
    }

    setExportError(undefined);
    setExportFailures([]);
    setIsExporting(true);

    const requestId = ++requestIdRef.current;

    try {
      const response = await new Promise<BatchExportResponse>((resolve, reject) => {
        pendingExportRef.current = { requestId, resolve, reject };

        const request: BatchWorkerRequest = {
          kind: "export",
          requestId,
          items: buildWorkerItems(batchItems),
          colorGroups: sharedConfig.colorGroups,
        };

        workerRef.current?.postMessage(request);
      });

      if (response.status === "failed") {
        setExportFailures(response.failures);
        return;
      }

      const encoder = new TextEncoder();
      const specJson = JSON.stringify({ selection, sharedConfig }, null, 2);
      const zipBytes = zipSync({
        [THREE_MF_FILE_NAME]: response.archive,
        [SPEC_FILE_NAME]: encoder.encode(specJson),
      });

      downloadBlob(zipBytes, ZIP_FILE_NAME, ZIP_MIME_TYPE);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExporting(false);
    }
  }, [batchItems, selection, sharedConfig]);

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
