import { DEFAULT_SHARED_CONFIG } from "./defaultSharedConfig";
import { SharedConfig } from "./tokenItem";

export const INVALID_SETTINGS_FILE_MESSAGE = "This file is not a valid settings file.";

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isSameKind = (defaultValue: unknown, value: unknown): boolean => {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(value);
  }

  if (isPlainObject(defaultValue)) {
    return isPlainObject(value);
  }

  return typeof value === typeof defaultValue;
};

// The fine-tuning settings (shapes, style, fit policy, colors...) live separately from the
// per-run token selection, so they can be shared/reused across runs independently of which
// tokens a given download happens to include. These are the fields every export has carried since
// the first one: a file without them is not a settings file at all.
const hasCoreSettingsFields = (value: unknown): boolean => {
  if (!isPlainObject(value)) {
    return false;
  }

  const candidate = value as Partial<SharedConfig>;

  return (
    typeof candidate.arcShape === "object" &&
    typeof candidate.discShape === "object" &&
    typeof candidate.goalInfluenceShape === "object" &&
    typeof candidate.style === "object" &&
    typeof candidate.fitPolicy === "object" &&
    typeof candidate.printProfileId === "string" &&
    Array.isArray(candidate.colorGroups) &&
    typeof candidate.influenceIconId === "string" &&
    typeof candidate.nameSizeMm === "number" &&
    typeof candidate.effectSizeMm === "number" &&
    typeof candidate.showSecondLine === "boolean" &&
    typeof candidate.balanceTwoLineSizes === "boolean"
  );
};

// Recurses into plain objects, so a file that has a group but lacks a field inside it still gets
// that field's default. Arrays (colorGroups) are taken whole. Keys the defaults lack are kept, since
// several shape fields are optional (innerDiameterMm, crowfoot) and have no default to compare with.
export const mergeWithDefaults = <T>(defaults: T, override: unknown): T => {
  if (!isPlainObject(defaults)) {
    return isSameKind(defaults, override) ? (override as T) : defaults;
  }

  if (!isPlainObject(override)) {
    return defaults;
  }

  const merged: PlainObject = { ...override };

  for (const [key, defaultValue] of Object.entries(defaults)) {
    merged[key] = key in override ? mergeWithDefaults(defaultValue, override[key]) : defaultValue;
  }

  return merged as T;
};

// A file must at least carry the core fields; anything newer it lacks is filled from the defaults
// rather than rejected, so a file exported before an option existed still imports cleanly.
export const parseSettingsFile = (parsed: unknown): SharedConfig => {
  if (!hasCoreSettingsFields(parsed)) {
    throw new Error(INVALID_SETTINGS_FILE_MESSAGE);
  }

  return mergeWithDefaults(DEFAULT_SHARED_CONFIG, parsed);
};
