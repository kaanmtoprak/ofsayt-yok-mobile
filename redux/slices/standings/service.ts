import { get } from "@/utilities/http/livescore";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export type CompetitionTableStandingRow = {
  rank: number;
  points: number;
  matches: number;
  goal_diff: number;
  goals_scored?: number;
  goals_conceded?: number;
  won: number;
  drawn: number;
  lost: number;
  team?: { id: number; name: string; logo?: string };
  team_id?: number;
  name?: string;
  logo?: string;
};

export type CompetitionTableData = {
  competition?: { id: number; name: string };
  season?: { id?: number; name?: string; start?: string; end?: string };
  stages?: Array<{
    stage?: { id?: number; name?: string };
    groups?: Array<{
      id?: number;
      name?: string;
      standings?: CompetitionTableStandingRow[];
    }>;
  }>;
  table?: CompetitionTableStandingRow[];
};

export type SeasonListItem = {
  id: number;
  name: string;
  start?: string;
  end?: string;
};

export type TopScorerEntry = {
  goals: number;
  assists?: number;
  played?: number;
  team?: { id?: number; name?: string; logo?: string };
  player?: { id?: number; name?: string; photo?: string };
};

export type TopScorersPayload = {
  competition?: { id?: number; name?: string };
  season?: { id?: number; name?: string; start?: string; end?: string };
  topscorers?: TopScorerEntry[];
};

const seasonSortKey = (s: SeasonListItem): number => {
  const end = s.end?.trim();
  if (end) {
    const t = Date.parse(end);
    if (Number.isFinite(t)) return t;
  }
  const start = s.start?.trim();
  if (start) {
    const t = Date.parse(start);
    if (Number.isFinite(t)) return t;
  }
  return 0;
};

const parseSlashSeasonYears = (name: string): { a: number; b: number } | null => {
  const m = /^(\d{4})\s*\/\s*(\d{4})$/.exec(name.trim());
  if (!m) return null;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { a, b };
};

const dedupeCalendarYearSeasons = (items: SeasonListItem[]): SeasonListItem[] => {
  const plainYear = /^\d{4}$/;
  const dropIds = new Set<number>();
  const slashPairs = items
    .map((s) => parseSlashSeasonYears(s.name))
    .filter((p): p is { a: number; b: number } => p != null);

  for (const season of items) {
    const n = season.name.trim();
    if (!plainYear.test(n)) continue;
    const y = parseInt(n, 10);
    for (const pair of slashPairs) {
      if (y === pair.a || y === pair.b) {
        dropIds.add(season.id);
        break;
      }
    }
  }
  return items.filter((s) => !dropIds.has(s.id));
};

const filterSeasonListForUi = (items: SeasonListItem[]): SeasonListItem[] => {
  const min = Date.parse("2000-01-01");
  return items.filter((s) => {
    const end = s.end?.trim();
    if (end) {
      const t = Date.parse(end);
      return Number.isFinite(t) && t >= min;
    }
    const start = s.start?.trim();
    if (start) {
      const t = Date.parse(start);
      return Number.isFinite(t) && t >= min;
    }
    return true;
  });
};

export const getSeasonsList = async (): Promise<SeasonListItem[]> => {
  const response = await get<ApiResponse<{ seasons?: unknown[] }>>("seasons/list");
  const raw = response.data?.seasons;
  if (!response.success || !Array.isArray(raw)) return [];

  const parsed = raw
    .map((row): SeasonListItem | null => {
      if (row == null || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const idRaw = r.id;
      const id = typeof idRaw === "string" ? parseInt(idRaw, 10) : Number(idRaw);
      const name = typeof r.name === "string" ? r.name : "";
      if (!Number.isFinite(id) || !name.trim()) return null;
      const start = typeof r.start === "string" ? r.start : undefined;
      const end = typeof r.end === "string" ? r.end : undefined;
      return { id, name: name.trim(), start, end };
    })
    .filter((x): x is SeasonListItem => x != null);

  const filtered = dedupeCalendarYearSeasons(filterSeasonListForUi(parsed));
  return filtered.sort((a, b) => seasonSortKey(b) - seasonSortKey(a));
};

export const getCompetitionTableFull = async (
  competitionId: string | number,
  query?: { season?: number; group_id?: number | string }
): Promise<CompetitionTableData | null> => {
  const params: Record<string, string | number> = {
    competition_id: String(competitionId),
  };
  if (query?.group_id != null && query.group_id !== "") {
    params.group_id = query.group_id;
  }
  if (query?.season != null && Number.isFinite(query.season)) {
    params.season_id = query.season;
  }

  const response = await get<ApiResponse<CompetitionTableData>>("competitions/table", params);
  if (response.success && response.data) return response.data;
  return null;
};

export const getTopScorers = async (
  competitionId: string | number,
  opts?: { season?: number }
): Promise<TopScorersPayload | null> => {
  const params: Record<string, string | number> = {
    competition_id: String(competitionId),
  };
  if (opts?.season != null && Number.isFinite(opts.season)) {
    params.season_id = opts.season;
  }

  const response = await get<ApiResponse<TopScorersPayload>>("competitions/topscorers", params);
  if (response.success && response.data) return response.data;
  return null;
};
