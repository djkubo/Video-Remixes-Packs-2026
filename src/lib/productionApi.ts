const PRODUCTION_API_BASE =
  (import.meta.env.VITE_PRODUCTION_API_BASE as string | undefined)?.trim().replace(/\/$/, "") || "";

function buildApiUrl(path: string): string {
  if (!PRODUCTION_API_BASE) return path;
  return `${PRODUCTION_API_BASE}${path}`;
}

export type TrendingCategory = "Audios" | "Videos" | "Karaoke";
export type MostDownloadedType = "File" | "Folder";

export interface ProductionGenre {
  id: string;
  name: string;
  color?: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenresSelectResponse {
  count: number;
  data: ProductionGenre[];
}

export interface ProductionFile {
  id?: string;
  name: string;
  title?: string;
  artist?: string;
  path?: string;
  genre?: string[];
  duration?: number;
  imageUrl?: string;
  encryptedPath?: string;
  type?: string;
  section?: string;
  date?: number;
}

export interface LastWeekPayload {
  week: number;
  month: string;
  year: number;
  startDate: number;
  endDate: number;
  files: ProductionFile[];
  imageUrl?: string;
}

export interface CheckEmailResponse {
  exists: boolean;
  user?: {
    fullName?: string;
    email?: string;
  } | null;
  oldUser?: unknown;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    fullName?: string;
    email?: string;
    role?: string;
  };
}

type RequestConfig = {
  method?: "GET" | "POST";
  token?: string;
  body?: Record<string, unknown>;
  signal?: AbortSignal;
};

async function requestJson<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (config.body) {
    headers.set("Content-Type", "application/json");
  }

  if (config.token) {
    headers.set("Authorization", `Bearer ${config.token}`);
  }

  const response = await fetch(buildApiUrl(path), {
    method: config.method ?? "GET",
    headers,
    body: config.body ? JSON.stringify(config.body) : undefined,
    signal: config.signal,
  });

  if (!response.ok) {
    throw new Error(`Production API error ${response.status} (${path})`);
  }

  return response.json() as Promise<T>;
}

export async function fetchGenresSelect(signal?: AbortSignal): Promise<GenresSelectResponse> {
  return requestJson<GenresSelectResponse>("/files/genres-select", { signal });
}

export async function fetchLastWeeks(signal?: AbortSignal): Promise<LastWeekPayload[]> {
  return requestJson<LastWeekPayload[]>("/files/lastWeeks", { signal });
}

export async function fetchTrending(
  category: TrendingCategory,
  signal?: AbortSignal,
  token?: string,
): Promise<ProductionFile[]> {
  return requestJson<ProductionFile[]>("/files/trending", {
    method: "POST",
    token,
    signal,
    body: {
      category,
      timeUnit: "week",
      timeValue: 1,
    },
  });
}

export async function fetchMostDownloaded(
  type: MostDownloadedType,
  range?: { startDate: string; finalDate: string },
  signal?: AbortSignal,
  token?: string,
): Promise<ProductionFile[]> {
  const defaultRange = getRecentDateRange(31);
  return requestJson<ProductionFile[]>("/files/mostDownloaded", {
    method: "POST",
    token,
    signal,
    body: {
      startDate: range?.startDate ?? defaultRange.startDate,
      finalDate: range?.finalDate ?? defaultRange.finalDate,
      type,
    },
  });
}

export async function checkEmailAvailability(
  email: string,
  signal?: AbortSignal,
): Promise<CheckEmailResponse> {
  return requestJson<CheckEmailResponse>("/auth/check", {
    method: "POST",
    signal,
    body: { email },
  });
}

export async function loginWithEmail(
  email: string,
  password: string,
  signal?: AbortSignal,
): Promise<LoginResponse> {
  return requestJson<LoginResponse>("/auth/login", {
    method: "POST",
    signal,
    body: { email, password },
  });
}

export function getRecentDateRange(days = 31): { startDate: string; finalDate: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  return {
    startDate: start.toISOString(),
    finalDate: now.toISOString(),
  };
}

export function formatDuration(seconds?: number): string {
  if (!seconds || Number.isNaN(seconds)) return "--:--";
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function extractGenreFromPath(path?: string): string | null {
  if (!path) return null;
  const segments = path.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  return segments[segments.length - 2] ?? null;
}

export function extractBpm(text?: string): number | null {
  if (!text) return null;
  const match = text.match(/(\d{2,3})\s*BPM/i);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isNaN(value) ? null : value;
}
