import type { ApiMatch } from "@/redux/slices/matches/matchesSlice";
import { get } from "@/utilities/http/livescore";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

type TeamLastMatchesResponse = {
  match?: ApiMatch[];
};

type SquadsResponse = {
  players?: SquadPlayer[];
};

type RostersResponse = {
  teams?: Array<{
    team?: { id?: number | string };
    players?: SquadPlayer[];
  }>;
};

type LeagueTableResponse = {
  table?: MiniTableRow[];
  stages?: Array<{
    groups?: Array<{
      standings?: MiniTableRow[];
    }>;
  }>;
};

export type TeamCompetition = {
  id: number;
  name: string;
};

export type SquadPlayer = {
  id?: number;
  name?: string;
  shirt_number?: number | string;
  position?: string;
};

export type MiniTableRow = {
  rank: number;
  matches: number;
  points: number;
  team_id?: number;
  name?: string;
  logo?: string;
  team?: { id?: number; name?: string; logo?: string };
};

const normalizeSquadList = (raw: unknown): SquadPlayer[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is SquadPlayer => p != null && typeof p === "object");
};

export const getTeamLastMatches = async (teamId: string, count = 10): Promise<ApiMatch[]> => {
  try {
    const response = await get<ApiResponse<TeamLastMatchesResponse>>("matches/history", {
      team_id: teamId,
      from: "2024-01-01",
      to: "2030-12-31",
    });
    const list = response.data?.match;
    if (!response.success || !Array.isArray(list)) return [];
    return list.slice(0, count);
  } catch {
    return [];
  }
};

export const getTeamCompetitions = (matches: ApiMatch[], teamId: string): TeamCompetition[] => {
  const seen = new Set<number>();
  const list: TeamCompetition[] = [];

  matches.forEach((m) => {
    const includesTeam =
      String(m.home?.id ?? "") === teamId || String(m.away?.id ?? "") === teamId;
    const compId = Number(m.competition?.id ?? 0);
    const compName = m.competition?.name?.trim() ?? "";
    if (!includesTeam || !Number.isFinite(compId) || compId <= 0 || !compName || seen.has(compId)) return;
    seen.add(compId);
    list.push({ id: compId, name: compName });
  });

  return list;
};

export const getTeamSquads = async (teamId: string, competitionId: string): Promise<SquadPlayer[]> => {
  try {
    const squadsRes = await get<ApiResponse<SquadsResponse | SquadPlayer[]>>("competitions/squads", {
      team_id: teamId,
      competition_id: competitionId,
    });

    if (squadsRes.success && squadsRes.data != null) {
      if (Array.isArray(squadsRes.data)) {
        const players = normalizeSquadList(squadsRes.data);
        if (players.length) return players;
      } else {
        const players = normalizeSquadList(squadsRes.data.players);
        if (players.length) return players;
      }
    }

    const rosterRes = await get<ApiResponse<RostersResponse>>("competitions/rosters", {
      competition_id: competitionId,
    });
    const teams = rosterRes.data?.teams;
    if (!rosterRes.success || !Array.isArray(teams)) return [];
    const target = teams.find((t) => String(t?.team?.id ?? "") === teamId);
    return normalizeSquadList(target?.players);
  } catch {
    return [];
  }
};

export const getLeagueTable = async (competitionId: string): Promise<MiniTableRow[]> => {
  try {
    const response = await get<ApiResponse<LeagueTableResponse>>("competitions/table", {
      competition_id: competitionId,
    });
    const data = response.data;
    if (!response.success || !data) return [];

    if (Array.isArray(data.table)) return data.table;

    if (Array.isArray(data.stages)) {
      return data.stages.flatMap((stage) =>
        (stage.groups || []).flatMap((group) => (group.standings || []) as MiniTableRow[])
      );
    }

    return [];
  } catch {
    return [];
  }
};
