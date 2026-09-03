import type { Font } from "opentype.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { downloadBlob } from "../browser/downloadBlob";
import { loadFont } from "../browser/loadFont";
import { loadIconManifest } from "../browser/loadIconManifest";
import { createLoadIconSource } from "../browser/loadIconSource";
import { buildTokenParts } from "../core/token/buildTokenParts";
import { computeReliefComponents } from "../core/token/computeReliefComponents";
import {
  DEFAULT_ARC_SHAPE,
  DEFAULT_FIT_POLICY,
  DEFAULT_STYLE,
} from "../core/token/defaultShapeAndStyle";
import { buildThreeMfArchive } from "../core/token/export/threeMfArchive";
import { buildThreeMfModelXml } from "../core/token/export/threeMfModel";
import { computePlateOffsets, PlateLayout } from "../core/token/geometry/computePlateOffsets";
import { ManifestEntry } from "../core/token/icons/iconManifest";
import { ReliefComponent } from "../core/token/mesh/reliefComponent";
import { DEFAULT_PRINT_PROFILE_ID, PRINT_PROFILES } from "../core/token/printProfiles";
import { TokenSpec } from "../core/token/types";
import { MinStrokeWidthValidation } from "../core/token/validation/validateMinStrokeWidth";
import { LIVE_PREVIEW_DEBOUNCE_MS } from "./livePreviewDebounce";

const THREE_MF_FILE_NAME = "token.3mf";
const SPEC_FILE_NAME = "token-spec.json";
const THREE_MF_MIME_TYPE = "model/3mf";
const JSON_MIME_TYPE = "application/json";

const DEFAULT_SPEC: TokenSpec = {
  version: 1,
  shape: DEFAULT_ARC_SHAPE,
  textLayout: "arc",
  lines: [{ text: "Momentum", sizeMm: 5 }],
  icons: [
    { iconId: "ball", side: "left", scale: 0.7 },
    { iconId: "ball", side: "right", scale: 0.7 },
  ],
  decorations: [],
  style: DEFAULT_STYLE,
  colorGroups: [{ id: "base", name: "Base", color: "#2B2B2B" }],
  printProfileId: DEFAULT_PRINT_PROFILE_ID,
  fitPolicy: DEFAULT_FIT_POLICY,
};

const DEFAULT_PLATE_LAYOUT: PlateLayout = { count: 1, columns: 1, spacingMm: 60 };

type LoadedResources = { font: Font; manifest: ManifestEntry[] };
type ResourceStatus = "loading" | "ready" | "error";

const isTokenSpec = (value: unknown): value is TokenSpec => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<TokenSpec>;

  return (
    candidate.version === 1 &&
    typeof candidate.shape === "object" &&
    Array.isArray(candidate.lines) &&
    Array.isArray(candidate.icons) &&
    typeof candidate.style === "object" &&
    Array.isArray(candidate.colorGroups) &&
    typeof candidate.printProfileId === "string" &&
    typeof candidate.fitPolicy === "object"
  );
};

export const useTokenSpec = () => {
  const [status, setStatus] = useState<ResourceStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [resources, setResources] = useState<LoadedResources>();

  const [spec, setSpec] = useState<TokenSpec>(DEFAULT_SPEC);
  const [plateLayout, setPlateLayout] = useState<PlateLayout>(DEFAULT_PLATE_LAYOUT);

  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<MinStrokeWidthValidation>();
  const [warnings, setWarnings] = useState<string[]>([]);
  const [reliefComponents, setReliefComponents] = useState<ReliefComponent[]>([]);

  const [exportError, setExportError] = useState<string>();
  const [importError, setImportError] = useState<string>();

  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadFont(), loadIconManifest()])
      .then(([font, manifest]) => {
        if (cancelled) {
          return;
        }

        setResources({ font, manifest });
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : String(error));
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadIconSource = useMemo(() => {
    if (!resources) {
      return undefined;
    }

    return createLoadIconSource(resources.manifest);
  }, [resources]);

  useEffect(() => {
    if (!resources || !loadIconSource) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const printProfile = PRINT_PROFILES[spec.printProfileId];

    setIsValidating(true);

    const timeoutId = setTimeout(() => {
      computeReliefComponents(spec, resources.font, printProfile, loadIconSource)
        .then((result) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setValidation(result.validation);
          setWarnings(result.warnings);
          setReliefComponents(result.reliefComponents);
          setIsValidating(false);
        })
        .catch((error: unknown) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setWarnings([error instanceof Error ? error.message : String(error)]);
          setIsValidating(false);
        });
    }, LIVE_PREVIEW_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [spec, resources, loadIconSource]);

  const exportThreeMf = useCallback(async () => {
    if (!resources || !loadIconSource) {
      return;
    }

    setExportError(undefined);

    try {
      const printProfile = PRINT_PROFILES[spec.printProfileId];
      const fresh = await computeReliefComponents(
        spec,
        resources.font,
        printProfile,
        loadIconSource,
      );
      const parts = await buildTokenParts(spec, fresh.reliefComponents);

      for (const part of parts) {
        if (part.manifold.status() !== "NoError") {
          throw new Error(
            `Part "${part.colorGroupId}" has an invalid mesh (status: ${part.manifold.status()}).`,
          );
        }
      }

      const plateOffsets = computePlateOffsets(plateLayout);
      const modelXml = buildThreeMfModelXml(parts, spec.colorGroups, plateOffsets);
      const archive = buildThreeMfArchive(modelXml);

      downloadBlob(archive, THREE_MF_FILE_NAME, THREE_MF_MIME_TYPE);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
    }
  }, [spec, resources, loadIconSource, plateLayout]);

  const exportSpecJson = useCallback(() => {
    const json = JSON.stringify(spec, null, 2);

    downloadBlob(json, SPEC_FILE_NAME, JSON_MIME_TYPE);
  }, [spec]);

  const importSpecJson = useCallback(async (file: File) => {
    setImportError(undefined);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!isTokenSpec(parsed)) {
        throw new Error("This file is not a valid token spec.");
      }

      setSpec(parsed);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  return {
    status,
    errorMessage,
    spec,
    setSpec,
    manifest: resources?.manifest ?? [],
    plateLayout,
    setPlateLayout,
    isValidating,
    validation,
    warnings,
    reliefComponents,
    exportThreeMf,
    exportError,
    exportSpecJson,
    importSpecJson,
    importError,
  };
};
