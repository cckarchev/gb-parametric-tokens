import { PRINT_PROFILES } from "../../printProfiles";
import { IconOverflowBehavior, ReliefStyle } from "../../types";
import { DEFAULT_SHARED_CONFIG } from "./defaultSharedConfig";
import { AoeTemplateVariant, SharedConfig } from "./tokenItem";

const RELIEF_STYLES: ReliefStyle[] = ["raised", "engraved"];
const ICON_OVERFLOW_BEHAVIORS: IconOverflowBehavior[] = ["none", "shrink", "trim", "grow"];
const AOE_TEMPLATE_VARIANTS: AoeTemplateVariant[] = ["ring", "compactDisc", "crowfoot"];

const INVALID_SETTINGS_FILE_MESSAGE = "This file is not a valid settings file.";

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

const pickKnown = <T extends string>(value: T, knownValues: readonly T[], fallback: T): T => {
  return knownValues.includes(value) ? value : fallback;
};

// mergeWithDefaults only checks that a value is a string; an option this app doesn't know (a
// typo, or a file from a newer version) would otherwise reach the builders, and an unknown print
// profile id would crash the worker's PRINT_PROFILES lookup.
const replaceUnknownOptions = (config: SharedConfig): SharedConfig => {
  const defaults = DEFAULT_SHARED_CONFIG;
  const knownPrintProfileIds = Object.keys(PRINT_PROFILES);

  return {
    ...config,
    style: {
      ...config.style,
      relief: pickKnown(config.style.relief, RELIEF_STYLES, defaults.style.relief),
    },
    printProfileId: pickKnown(config.printProfileId, knownPrintProfileIds, defaults.printProfileId),
    iconOverflowBehavior: pickKnown(
      config.iconOverflowBehavior,
      ICON_OVERFLOW_BEHAVIORS,
      defaults.iconOverflowBehavior,
    ),
    aoeTemplateVariant: pickKnown(
      config.aoeTemplateVariant,
      AOE_TEMPLATE_VARIANTS,
      defaults.aoeTemplateVariant,
    ),
  };
};

// A file must at least carry the core fields; anything newer it lacks is filled from the defaults
// rather than rejected, so a file exported before an option existed still imports cleanly.
export const parseSettingsFile = (parsed: unknown): SharedConfig => {
  if (!hasCoreSettingsFields(parsed)) {
    throw new Error(INVALID_SETTINGS_FILE_MESSAGE);
  }

  const merged = mergeWithDefaults(DEFAULT_SHARED_CONFIG, parsed);

  return replaceUnknownOptions(merged);
};
