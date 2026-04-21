import type { ApiMatch } from "@/redux/slices/matches/matchesSlice";
import { get } from "@/utilities/http/livescore";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

type MatchEventsPayload = {
  match?: ApiMatch | null;
  event?: MatchEvent[];
};

type MatchStatsPayload = MatchStatsData | MatchStatsData[] | null;

export type MatchEvent = {
  id: number;
  time: number;
  event: string;
  sort?: number;
  info?: string | null;
  label?: string;
  is_home?: boolean;
  is_away?: boolean;
  player?: { id?: number; name?: string };
};

export type MatchStatsData = Record<string, string | number | null | undefined>;

export type LineupPlayer = {
  id?: number;
  name?: string;
  shirt_number?: string | number;
  substitution?: string | number;
  position?: string;
};

type LineupSide = {
  team?: { id?: number; name?: string; logo?: string };
  players?: LineupPlayer[];
};

export type MatchLineupData = {
  lineup?: {
    home?: LineupSide;
    away?: LineupSide;
  };
};

const mergeMatchReferee = (match: ApiMatch | null | undefined): ApiMatch | null => {
  if (!match) return null;
  const raw = match as ApiMatch & { referee_name?: string; official?: string; referee?: string };
  const referee = raw.referee?.trim() || raw.referee_name?.trim() || raw.official?.trim() || "";
  if (!referee) return match;
  return {
    ...match,
    referee,
  } as ApiMatch;
};

const toStatsObject = (data: MatchStatsPayload): MatchStatsData | null => {
  if (data == null) return null;
  if (Array.isArray(data)) return (data[0] as MatchStatsData | undefined) ?? null;
  if (typeof data === "object") return data;
  return null;
};

export const getMatchWithEvents = async (
  matchId: string
): Promise<{ match: ApiMatch | null; events: MatchEvent[] }> => {
  const response = await get<ApiResponse<MatchEventsPayload>>("matches/events", { match_id: matchId });
  if (!response.success || !response.data) {
    return { match: null, events: [] };
  }
  const match = mergeMatchReferee(response.data.match ?? null);
  const events = Array.isArray(response.data.event) ? response.data.event : [];
  return { match, events };
};

export const getMatchStats = async (matchId: string): Promise<MatchStatsData | null> => {
  const response = await get<ApiResponse<MatchStatsPayload>>("matches/stats", { match_id: matchId });
  if (!response.success) return null;
  return toStatsObject(response.data ?? null);
};

export const getMatchLineups = async (matchId: string): Promise<MatchLineupData | null> => {
  const response = await get<ApiResponse<MatchLineupData>>("matches/lineups", { match_id: matchId });
  if (!response.success || !response.data) return null;
  return response.data;
};
