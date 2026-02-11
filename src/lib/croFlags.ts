import type { ExperimentId } from "@/lib/experiments";
import { ALL_EXPERIMENT_IDS } from "@/lib/experiments";

export type CROFlags = Record<ExperimentId, boolean>;

const CRO_FLAGS_STORAGE_KEY = "vrp_cro_flags_v1";

const DEFAULT_FLAGS: CROFlags = {
  home_hero_cta: true,
  pricing_layout: true,
  lead_form_friction: true,
  social_proof_position: true,
};

function isBooleanRecord(value: unknown): value is Partial<Record<ExperimentId, boolean>> {
  if (!value || typeof value !== "object") return false;
  return true;
}

function parseQueryBoolean(value: string | null): boolean | null {
  if (!value) return null;
  if (value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "on") return true;
  if (value === "0" || value.toLowerCase() === "false" || value.toLowerCase() === "off") return false;
  return null;
}

function getStoredOverrides(): Partial<Record<ExperimentId, boolean>> {
  try {
    const raw = localStorage.getItem(CRO_FLAGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!isBooleanRecord(parsed)) return {};

    const overrides: Partial<Record<ExperimentId, boolean>> = {};
    for (const id of ALL_EXPERIMENT_IDS) {
      const value = (parsed as Record<string, unknown>)[id];
      if (typeof value === "boolean") {
        overrides[id] = value;
      }
    }
    return overrides;
  } catch {
    return {};
  }
}

function getQueryOverrides(): Partial<Record<ExperimentId, boolean>> {
  const overrides: Partial<Record<ExperimentId, boolean>> = {};
  const params = new URLSearchParams(window.location.search);

  const allValue = parseQueryBoolean(params.get("cro_all"));
  if (allValue !== null) {
    for (const id of ALL_EXPERIMENT_IDS) {
      overrides[id] = allValue;
    }
  }

  for (const id of ALL_EXPERIMENT_IDS) {
    const queryValue = parseQueryBoolean(params.get(`ff_${id}`));
    if (queryValue !== null) {
      overrides[id] = queryValue;
    }
  }
  return overrides;
}

export function getCROFlags(): CROFlags {
  return {
    ...DEFAULT_FLAGS,
    ...getStoredOverrides(),
    ...getQueryOverrides(),
  };
}

export function isExperimentEnabled(id: ExperimentId): boolean {
  return getCROFlags()[id];
}

export function getEnabledExperimentIds(): ExperimentId[] {
  const flags = getCROFlags();
  return ALL_EXPERIMENT_IDS.filter((id) => flags[id]);
}

export function setCROFlag(id: ExperimentId, enabled: boolean): void {
  const overrides = getStoredOverrides();
  overrides[id] = enabled;
  try {
    localStorage.setItem(CRO_FLAGS_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Ignore storage write errors.
  }
}
