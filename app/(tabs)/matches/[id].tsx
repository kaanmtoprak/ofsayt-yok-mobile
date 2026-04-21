import EventsCard from "@/components/match-detail/EventsCard";
import LineupCard from "@/components/match-detail/LineupCard";
import MatchHeaderCard from "@/components/match-detail/MatchHeaderCard";
import StandingsCard from "@/components/match-detail/StandingsCard";
import StatsCard from "@/components/match-detail/StatsCard";
import type { ApiMatch } from "@/redux/slices/matches/matchesSlice";
import {
  getCompetitionTableFull,
  getSeasonsList,
  type CompetitionTableData,
  type SeasonListItem,
} from "@/redux/slices/standings/service";
import {
  getMatchLineups,
  getMatchStats,
  getMatchWithEvents,
  type MatchEvent,
  type MatchLineupData,
  type MatchStatsData,
} from "@/services/matchDetailApi";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const resolveSeasonId = (seasons: SeasonListItem[], tableData: CompetitionTableData | null): number | null => {
  const fromTable =
    tableData?.season?.id != null && Number.isFinite(Number(tableData.season.id))
      ? Number(tableData.season.id)
      : null;
  if (fromTable != null && seasons.some((s) => s.id === fromTable)) return fromTable;
  return seasons[0]?.id ?? fromTable;
};

const MatchDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const matchId = Array.isArray(id) ? id[0] : id;
  const requestRef = useRef(0);

  const [match, setMatch] = useState<ApiMatch | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [stats, setStats] = useState<MatchStatsData | null>(null);
  const [lineups, setLineups] = useState<MatchLineupData | null>(null);

  const [seasons, setSeasons] = useState<SeasonListItem[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [standings, setStandings] = useState<CompetitionTableData | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStandingsBySeason = useCallback(
    async (seasonId: number) => {
      const competitionId = match?.competition?.id;
      if (!competitionId) return;
      setSelectedSeasonId(seasonId);
      setStandingsLoading(true);
      setStandingsError(null);
      try {
        const table = await getCompetitionTableFull(competitionId, { season: seasonId });
        setStandings(table);
      } catch (e) {
        setStandingsError(e instanceof Error ? e.message : "Puan durumu yüklenemedi.");
      } finally {
        setStandingsLoading(false);
      }
    },
    [match?.competition?.id]
  );

  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      setError("Maç bulunamadı.");
      return;
    }

    const requestId = ++requestRef.current;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      setStandingsError(null);
      setStandings(null);
      setSeasons([]);
      setSelectedSeasonId(null);

      try {
        const [eventsRes, statsRes, lineupsRes] = await Promise.all([
          getMatchWithEvents(matchId),
          getMatchStats(matchId),
          getMatchLineups(matchId),
        ]);
        if (cancelled || requestRef.current !== requestId) return;

        setMatch(eventsRes.match);
        setEvents(eventsRes.events);
        setStats(statsRes);
        setLineups(lineupsRes);

        const competitionId = eventsRes.match?.competition?.id;
        if (competitionId != null) {
          setStandingsLoading(true);
          const [seasonsList, table1] = await Promise.all([
            getSeasonsList(),
            getCompetitionTableFull(competitionId),
          ]);
          if (cancelled || requestRef.current !== requestId) return;

          setSeasons(seasonsList);
          const sid = resolveSeasonId(seasonsList, table1);
          setSelectedSeasonId(sid);

          let finalTable = table1;
          if (
            sid != null &&
            table1 != null &&
            (table1.season?.id == null || Number(table1.season.id) !== sid)
          ) {
            finalTable = await getCompetitionTableFull(competitionId, { season: sid });
          }
          if (cancelled || requestRef.current !== requestId) return;
          setStandings(finalTable ?? table1);
          setStandingsLoading(false);
        } else {
          setStandingsLoading(false);
        }
      } catch (e) {
        if (cancelled || requestRef.current !== requestId) return;
        setError(e instanceof Error ? e.message : "Maç detayı yüklenemedi.");
      } finally {
        if (!cancelled && requestRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return (
    <View className="flex-1 bg-[#F6F7F9]">
      <View style={{ paddingTop: Math.max(insets.top, 8) }} className="px-4 pb-3 pt-2">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="rounded-full bg-white px-3 py-1.5 shadow-sm">
            <Text className="text-sm font-semibold text-neutral-700">Geri</Text>
          </Pressable>
          <Text className="ml-3 text-lg font-bold text-neutral-900">Maç Detayı</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="mt-2 text-sm text-neutral-500">Maç detayı yükleniyor...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-neutral-600">{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <MatchHeaderCard
            match={match}
            onPressHomeTeam={(teamId) => {
              router.push({ pathname: "/teams/[id]", params: { id: String(teamId) } });
            }}
            onPressAwayTeam={(teamId) => {
              router.push({ pathname: "/teams/[id]", params: { id: String(teamId) } });
            }}
          />
          <View className="h-3" />
          <StatsCard stats={stats} />
          <View className="h-3" />
          <EventsCard events={events} />
          <View className="h-3" />
          <LineupCard lineups={lineups} />
          <View className="h-3" />
          {standingsError ? (
            <View className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <Text className="text-sm text-neutral-500">{standingsError}</Text>
            </View>
          ) : (
            <StandingsCard
              data={standings}
              seasons={seasons}
              selectedSeasonId={selectedSeasonId}
              loading={standingsLoading}
              onPressTeam={(teamId) => {
                router.push({ pathname: "/teams/[id]", params: { id: String(teamId) } });
              }}
              onSeasonChange={(sid) => {
                void loadStandingsBySeason(sid);
              }}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default MatchDetailScreen;
