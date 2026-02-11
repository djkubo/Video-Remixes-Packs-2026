export type ExperimentId =
  | "home_hero_cta"
  | "pricing_layout"
  | "lead_form_friction"
  | "social_proof_position";

export type VariantId = "A" | "B";

export interface ExperimentAssignment {
  id: ExperimentId;
  variant: VariantId;
  assignedAt: string;
}

const ASSIGNMENTS_STORAGE_KEY = "vrp_experiment_assignments_v1";
const VISITOR_STORAGE_KEY = "vrp_visitor_id";

export const ALL_EXPERIMENT_IDS: ExperimentId[] = [
  "home_hero_cta",
  "pricing_layout",
  "lead_form_friction",
  "social_proof_position",
];

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getVisitorId(): string {
  const existing = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;

  const generated = crypto.randomUUID();
  localStorage.setItem(VISITOR_STORAGE_KEY, generated);
  return generated;
}

function isVariantId(value: unknown): value is VariantId {
  return value === "A" || value === "B";
}

function isExperimentId(value: unknown): value is ExperimentId {
  return typeof value === "string" && ALL_EXPERIMENT_IDS.includes(value as ExperimentId);
}

function readAssignments(): Partial<Record<ExperimentId, ExperimentAssignment>> {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const sanitized: Partial<Record<ExperimentId, ExperimentAssignment>> = {};

    for (const key of Object.keys(parsed)) {
      const value = parsed[key] as ExperimentAssignment | undefined;
      if (
        isExperimentId(key) &&
        value &&
        isVariantId(value.variant) &&
        typeof value.assignedAt === "string"
      ) {
        sanitized[key] = {
          id: key,
          variant: value.variant,
          assignedAt: value.assignedAt,
        };
      }
    }

    return sanitized;
  } catch {
    return {};
  }
}

function writeAssignments(assignments: Partial<Record<ExperimentId, ExperimentAssignment>>): void {
  try {
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  } catch {
    // Ignore storage write errors.
  }
}

function chooseVariant(id: ExperimentId, visitorId: string): VariantId {
  return hashString(`${visitorId}:${id}`) % 2 === 0 ? "A" : "B";
}

export function getExperimentAssignment(id: ExperimentId): ExperimentAssignment {
  const stored = readAssignments();
  const existing = stored[id];
  if (existing) return existing;

  const assignment: ExperimentAssignment = {
    id,
    variant: chooseVariant(id, getVisitorId()),
    assignedAt: new Date().toISOString(),
  };
  stored[id] = assignment;
  writeAssignments(stored);
  return assignment;
}

export function getExperimentAssignments(ids: ExperimentId[]): ExperimentAssignment[] {
  return ids.map((id) => getExperimentAssignment(id));
}

export function getAllExperimentAssignments(): ExperimentAssignment[] {
  return getExperimentAssignments(ALL_EXPERIMENT_IDS);
}
