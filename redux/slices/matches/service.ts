import { compareGroupedLeagues } from "@/constants/leagues";
import { get } from "@/utilities/http/livescore";
import type { ApiMatch, ApiTeam } from "./matchesSlice";

type MatchesApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  data?: {
    match?: ApiMatch[];
    fixtures?: ApiFixture[];
    fixture?: ApiFixture[];
    total_pages?: string | number;
  };
};

type ApiFixture = {
  id: number;
  date?: string;
  time?: string;
  location?: string;
  home?: Partial<ApiTeam> & { id?: number; name?: string; logo?: string };
  away?: Partial<ApiTeam> & { id?: number; name?: string; logo?: string };
  competition?: ApiMatch["competition"];
  country?: ApiMatch["country"];
  group_id?: number;
  group_name?: string;
};

type PaginatedMatches = {
  matches: ApiMatch[];
  totalPages: number;
  page: number;
};

export type GroupedLeagueMatches = {
  competition_id: number;
  competition_name: string;
  country_id?: number;
  country_name?: string;
  country_flag?: string;
  competition_logo?: string;
  matches: ApiMatch[];
};

const parseTotalPages = (data: unknown): number => {
  if (data == null || typeof data !== "object") return 1;
  const raw = (data as { total_pages?: unknown }).total_pages;
  const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
  return Number.isFinite(n) && n >= 1 ? n : 1;
};

const dedupeMatchesById = (matches: ApiMatch[]): ApiMatch[] => {
  const map = new Map<number, ApiMatch>();
  for (const m of matches) {
    const id = Number(m.id);
    if (!Number.isFinite(id)) continue;
    map.set(id, m);
  }
  return Array.from(map.values());
};

const getMatchesByDate = async (
  date: string,
  page = 1,
  competitionId?: number
): Promise<PaginatedMatches> => {
  const params: Record<string, string | number | boolean | undefined> = {
    from: date,
    to: date,
    page,
  };
  if (competitionId != null) params.competition_id = competitionId;
  const response = await get<MatchesApiResponse>("matches/history.json", params);
  if (response.success && Array.isArray(response.data?.match)) {
    return {
      matches: response.data.match,
      totalPages: parseTotalPages(response.data),
      page,
    };
  }
  return { matches: [], totalPages: 1, page };
};

const getAllMatchesByDate = async (date: string, competitionId?: number): Promise<ApiMatch[]> => {
  const first = await getMatchesByDate(date, 1, competitionId);
  if (first.totalPages <= 1) return dedupeMatchesById(first.matches);
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) => getMatchesByDate(date, i + 2, competitionId))
  );
  return dedupeMatchesById([...first.matches, ...rest.flatMap((r) => r.matches)]);
};

const getLiveMatches = async (page = 1, competitionId?: number): Promise<PaginatedMatches> => {
  const params: Record<string, string | number | boolean | undefined> = { page };
  if (competitionId != null) params.competition_id = competitionId;
  const response = await get<MatchesApiResponse>("matches/live.json", params);
  if (response.success && Array.isArray(response.data?.match)) {
    return {
      matches: response.data.match,
      totalPages: parseTotalPages(response.data),
      page,
    };
  }
  return { matches: [], totalPages: 1, page };
};

const getAllLiveMatches = async (competitionId?: number): Promise<ApiMatch[]> => {
  const first = await getLiveMatches(1, competitionId);
  if (first.totalPages <= 1) return dedupeMatchesById(first.matches);
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) => getLiveMatches(i + 2, competitionId))
  );
  return dedupeMatchesById([...first.matches, ...rest.flatMap((r) => r.matches)]);
};

const todayIsoUtc = (): string => new Date().toISOString().slice(0, 10);

const normalizeFixtureToMatch = (raw: ApiFixture): ApiMatch => {
  return {
    id: Number(raw.id),
    status: "NOT STARTED",
    time: "",
    date: raw.date,
    scheduled: raw.time,
    location: raw.location,
    home: {
      id: Number(raw.home?.id ?? 0),
      name: raw.home?.name ?? "",
      logo: raw.home?.logo ?? "",
    },
    away: {
      id: Number(raw.away?.id ?? 0),
      name: raw.away?.name ?? "",
      logo: raw.away?.logo ?? "",
    },
    country: raw.country,
    competition: raw.competition,
    fixture_id: raw.id,
    group_id: raw.group_id,
    group_name: raw.group_name,
  };
};

const getFixturesByDate = async (isoDate: string, competitionId?: number): Promise<ApiMatch[]> => {
  const dateParam = isoDate === todayIsoUtc() ? "today" : isoDate;
  const params: Record<string, string | number | boolean | undefined> = { date: dateParam, page: 1 };
  if (competitionId != null) params.competition_id = competitionId;
  const response = await get<MatchesApiResponse>("fixtures/list.json", params);
  const list = response.data?.fixtures ?? response.data?.fixture;
  if (response.success && Array.isArray(list)) {
    return list.map(normalizeFixtureToMatch);
  }
  if (response.success && Array.isArray(response.data?.match)) {
    return response.data.match;
  }
  return [];
};

const isLiveMatchOnSelectedDate = (m: ApiMatch, selectedDate: string): boolean => {
  const d = m.date?.trim();
  if (d) return d === selectedDate;
  return selectedDate === todayIsoUtc();
};

const mergeMatchesForAllTab = ({
  selectedDate,
  historyPageMatches,
  liveMatches,
  fixtures,
}: {
  selectedDate: string;
  historyPageMatches: ApiMatch[];
  liveMatches: ApiMatch[];
  fixtures: ApiMatch[];
}): ApiMatch[] => {
  const liveOnDay = liveMatches.filter((m) => isLiveMatchOnSelectedDate(m, selectedDate));
  const map = new Map<number, ApiMatch>();
  for (const f of fixtures) map.set(Number(f.id), f);
  for (const h of historyPageMatches) map.set(Number(h.id), h);
  for (const l of liveOnDay) map.set(Number(l.id), l);
  return dedupeMatchesById(Array.from(map.values()));
};

const allTabStatusRank = (m: ApiMatch): number => {
  if (m.status === "IN PLAY") return 0;
  if (m.status === "HALF TIME BREAK") return 1;
  if (m.status === "NOT STARTED") return 2;
  if (m.status === "FINISHED") return 3;
  return 4;
};

const kickoffSortKey = (m: ApiMatch): string => {
  const s = (m.scheduled ?? m.time ?? "").trim();
  const hm = /^\d{2}:\d{2}/.exec(s)?.[0];
  return hm ?? "99:99";
};

const compareMatchesForAllTab = (a: ApiMatch, b: ApiMatch): number => {
  const ra = allTabStatusRank(a);
  const rb = allTabStatusRank(b);
  if (ra !== rb) return ra - rb;
  return kickoffSortKey(a).localeCompare(kickoffSortKey(b));
};

const groupMatchesByLeague = (matches: ApiMatch[]): GroupedLeagueMatches[] => {
  const grouped = new Map<number, GroupedLeagueMatches>();
  matches.forEach((match) => {
    const competitionId = match.competition?.id || 0;
    const competitionName = match.competition?.name || match.competition_name || "";
    const countryObj = typeof match.country === "string" ? undefined : match.country;

    if (!grouped.has(competitionId)) {
      grouped.set(competitionId, {
        competition_id: competitionId,
        competition_name: competitionName,
        country_id: countryObj?.id,
        country_name: countryObj?.name ?? (typeof match.country === "string" ? match.country : undefined),
        country_flag: countryObj?.flag,
        competition_logo: match.competition?.logo,
        matches: [],
      });
    }
    grouped.get(competitionId)!.matches.push(match);
  });

  return Array.from(grouped.values()).sort(compareGroupedLeagues);
};

const sortGroupedMatchesForAllTab = (groups: GroupedLeagueMatches[]): GroupedLeagueMatches[] => {
  return groups.map((g) => ({
    ...g,
    matches: [...g.matches].sort(compareMatchesForAllTab),
  }));
};

export {
  parseTotalPages,
  dedupeMatchesById,
  getMatchesByDate,
  getAllMatchesByDate,
  getLiveMatches,
  getAllLiveMatches,
  getFixturesByDate,
  normalizeFixtureToMatch,
  isLiveMatchOnSelectedDate,
  mergeMatchesForAllTab,
  groupMatchesByLeague,
  sortGroupedMatchesForAllTab,
};
