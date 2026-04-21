import { SIDEBAR_LEAGUES } from "@/constants/leagues";
import {
  loadStandingsByCompetition,
  loadStandingsBySeason,
  loadStandingsInitial,
  setSidebarTab,
  type SidebarTab,
} from "@/redux/slices/standings/standingsSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import type { CompetitionTableStandingRow, TopScorerEntry } from "@/redux/slices/standings/service";
import { formatSeasonLabel } from "@/utilities/seasonLabel";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, Text, View } from "react-native";

const numCell = "w-8 text-center text-[12px] font-semibold text-neutral-700";

const rankBadgeClass = (rank: number) => {
  if (rank <= 4) return "bg-blue-600";
  if (rank >= 16) return "bg-red-600";
  return "bg-gray-200";
};

const scorerBadgeClass = (rank: number) => {
  if (rank === 1) return "bg-green-600";
  if (rank === 2) return "bg-amber-500";
  if (rank === 3) return "bg-sky-500";
  return "bg-neutral-200";
};

type SelectType = "season" | null;

const flattenStandings = (tableData: any): CompetitionTableStandingRow[] => {
  if (!tableData) return [];
  if (Array.isArray(tableData.table) && tableData.table.length) {
    return tableData.table as CompetitionTableStandingRow[];
  }
  const stages = tableData.stages;
  if (!Array.isArray(stages)) return [];
  return stages.flatMap((stage: any) =>
    (stage.groups || []).flatMap((group: any) => (group.standings || []) as CompetitionTableStandingRow[])
  );
};

const Points = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [activeSelect, setActiveSelect] = useState<SelectType>(null);
  const {
    sidebarTab,
    selectedCompetitionId,
    seasons,
    selectedSeasonId,
    tableData,
    topScorers,
    loading,
    error,
    initialized,
  } = useAppSelector((state) => state.standings);

  useEffect(() => {
    if (!initialized) {
      dispatch(loadStandingsInitial());
    }
  }, [dispatch, initialized]);

  const selectedLeague = useMemo(
    () => SIDEBAR_LEAGUES.find((l) => l.id === selectedCompetitionId) ?? SIDEBAR_LEAGUES[0],
    [selectedCompetitionId]
  );
  const selectedSeason = useMemo(
    () => seasons.find((s) => s.id === selectedSeasonId) ?? null,
    [seasons, selectedSeasonId]
  );
  const rows = useMemo(() => flattenStandings(tableData), [tableData]);
  const scorerRows = useMemo(() => topScorers?.topscorers ?? [], [topScorers]);
  const seasonLabel = selectedSeason ? formatSeasonLabel(selectedSeason.name) : "Sezon sec";

  return (
    <View className="flex-1 bg-white">
      {/* Top tabs */}
      <View className="flex-row border-b border-neutral-200">
        <Pressable
          onPress={() => dispatch(setSidebarTab("standings"))}
          className={`flex-1 py-2 ${sidebarTab === "standings" ? "border-b-2 border-green-600" : ""}`}
        >
          <Text
            className={`text-center text-[13px] font-semibold ${
              sidebarTab === "standings" ? "text-green-700" : "text-neutral-700"
            }`}
          >
            Puan Durumu
          </Text>
        </Pressable>

        <Pressable
          onPress={() => dispatch(setSidebarTab("leagues"))}
          className={`flex-1 py-2 ${sidebarTab === "leagues" ? "border-b-2 border-green-600" : ""}`}
        >
          <Text
            className={`text-center text-[13px] font-semibold ${
              sidebarTab === "leagues" ? "text-green-700" : "text-neutral-700"
            }`}
          >
            Ligler
          </Text>
        </Pressable>
      </View>

      {sidebarTab === "leagues" ? (
        <FlatList
          data={SIDEBAR_LEAGUES}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedCompetitionId;
            return (
              <Pressable
                onPress={() => {
                  dispatch(setSidebarTab("standings"));
                  dispatch(loadStandingsByCompetition({ competitionId: item.id }));
                }}
                className={`px-4 py-4 border-b border-neutral-100 ${isSelected ? "bg-green-50" : "bg-white"}`}
              >
                <Text className={`text-base font-semibold ${isSelected ? "text-green-700" : "text-neutral-900"}`}>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      ) : (
        <View className="flex-1">
          {/* League header */}
          <View className="border-b border-neutral-200 px-4 pb-2.5 pt-3">
            <View className="flex-row items-start justify-between">
              <Text className="flex-1 pr-2 text-lg font-bold text-neutral-900">{selectedLeague.name}</Text>
              <View className="w-[152px]">
                <Pressable
                  onPress={() => setActiveSelect("season")}
                  className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5"
                >
                  <Text className="text-[10px] text-neutral-500">Sezon</Text>
                  <Text className="mt-0.5 text-xs font-semibold text-neutral-800" numberOfLines={1}>
                    {seasonLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-neutral-500">{error}</Text>
            </View>
          ) : rows.length === 0 && scorerRows.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-neutral-500">Puan tablosu bulunamadi.</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={rows}
                keyExtractor={(item, index) => `${item.team?.id ?? item.team_id ?? item.name ?? "t"}_${index}`}
                ListHeaderComponent={
                  <View className="h-10 px-2 flex-row items-center bg-neutral-50 border-b border-neutral-200">
                    <Text className="w-8 text-center text-[12px] font-bold text-neutral-600">#</Text>
                    <Text className="flex-1 text-[12px] font-bold text-neutral-600">Takim</Text>
                    <Text className={numCell}>O</Text>
                    <Text className={numCell}>G</Text>
                    <Text className={numCell}>B</Text>
                    <Text className={numCell}>M</Text>
                    <Text className={numCell}>A</Text>
                    <Text className={numCell}>Y</Text>
                    <Text className={numCell}>Av</Text>
                    <Text className="w-9 text-center text-[12px] font-bold text-green-700">P</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const teamName = item.team?.name ?? item.name ?? "—";
                  const logo = item.team?.logo ?? item.logo;
                  const teamId = Number(item.team?.id ?? item.team_id ?? 0);
                  return (
                    <View className="h-11 px-2 flex-row items-center border-b border-neutral-100">
                      <View className={`w-6 h-6 rounded-md items-center justify-center ${rankBadgeClass(item.rank)}`}>
                        <Text className="text-[11px] font-bold text-white">{item.rank}</Text>
                      </View>

                      <Pressable
                        className="flex-1 ml-2 flex-row items-center"
                        onPress={() => {
                          if (!Number.isFinite(teamId) || teamId <= 0) return;
                          router.push({ pathname: "/teams/[id]", params: { id: String(teamId) } });
                        }}
                      >
                        {logo ? (
                          <Image source={{ uri: logo }} style={{ width: 16, height: 16, marginRight: 6 }} contentFit="contain" />
                        ) : null}
                        <Text numberOfLines={1} className="flex-1 text-[13px] font-semibold text-neutral-900">
                          {teamName}
                        </Text>
                      </Pressable>

                      <Text className={numCell}>{item.matches}</Text>
                      <Text className={numCell}>{item.won}</Text>
                      <Text className={numCell}>{item.drawn}</Text>
                      <Text className={numCell}>{item.lost}</Text>
                      <Text className={numCell}>{item.goals_scored ?? "—"}</Text>
                      <Text className={numCell}>{item.goals_conceded ?? "—"}</Text>
                      <Text className={numCell}>{item.goal_diff}</Text>
                      <Text className="w-9 text-center text-[13px] font-bold text-green-700">{item.points}</Text>
                    </View>
                  );
                }}
                ListFooterComponent={
                  <View className="mt-4 px-2">
                    <View className="mb-1 rounded-t-xl bg-neutral-100 px-3 py-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base font-bold text-neutral-900">Gol Kralligi</Text>
                        <Text className="text-xs font-semibold text-neutral-600">{seasonLabel}</Text>
                      </View>
                    </View>
                    <View className="h-9 flex-row items-center border-b border-neutral-200 bg-neutral-50 px-2">
                      <Text className="w-8 text-center text-[12px] font-bold text-neutral-600">#</Text>
                      <Text className="flex-1 text-[12px] font-bold text-neutral-600">Oyuncu</Text>
                      <Text className="w-8 text-center text-[12px] font-bold text-neutral-600">O</Text>
                      <Text className="w-8 text-center text-[12px] font-bold text-neutral-600">A</Text>
                      <Text className="w-8 text-center text-[12px] font-bold text-green-700">G</Text>
                    </View>
                    {scorerRows.map((s: TopScorerEntry, i: number) => {
                      const rank = i + 1;
                      const playerName = s.player?.name ?? "—";
                      const teamName = s.team?.name ?? "Takim";
                      const played = s.played ?? 0;
                      const assists = s.assists ?? 0;
                      const goals = s.goals ?? 0;
                      return (
                        <View key={`${s.player?.id ?? playerName}_${i}`} className="h-12 flex-row items-center border-b border-neutral-100 px-2">
                          <View className={`h-6 w-6 items-center justify-center rounded-md ${scorerBadgeClass(rank)}`}>
                            <Text className={`text-[11px] font-bold ${rank <= 3 ? "text-white" : "text-neutral-700"}`}>
                              {rank}
                            </Text>
                          </View>
                          <View className="ml-2 flex-1 flex-row items-center">
                            {s.player?.photo ? (
                              <Image source={{ uri: s.player.photo }} style={{ width: 18, height: 18, borderRadius: 9, marginRight: 6 }} contentFit="cover" />
                            ) : null}
                            {s.team?.logo ? (
                              <Image source={{ uri: s.team.logo }} style={{ width: 14, height: 14, marginRight: 6 }} contentFit="contain" />
                            ) : null}
                            <View className="flex-1">
                              <Text numberOfLines={1} className="text-[13px] font-semibold text-neutral-900">
                                {playerName}
                              </Text>
                              <Text numberOfLines={1} className="text-[11px] text-neutral-500">
                                {teamName}
                              </Text>
                            </View>
                          </View>
                          <Text className="w-8 text-center text-[12px] font-semibold text-neutral-700">{played}</Text>
                          <Text className="w-8 text-center text-[12px] font-semibold text-neutral-700">{assists}</Text>
                          <Text className="w-8 text-center text-[12px] font-bold text-green-700">{goals}</Text>
                        </View>
                      );
                    })}
                    {scorerRows.length === 0 ? (
                      <View className="items-center justify-center py-5">
                        <Text className="text-sm text-neutral-500">Gol kralligi verisi bulunamadi.</Text>
                      </View>
                    ) : null}
                  </View>
                }
              />
            </>
          )}
        </View>
      )}

      <Modal visible={activeSelect != null} transparent animationType="fade" onRequestClose={() => setActiveSelect(null)}>
        <View className="flex-1 justify-end bg-black/35">
          <View className="max-h-[70%] rounded-t-2xl bg-white px-4 pb-4 pt-3">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-neutral-900">Sezon Sec</Text>
              <Pressable onPress={() => setActiveSelect(null)}>
                <Text className="text-sm font-semibold text-green-700">Kapat</Text>
              </Pressable>
            </View>

            <FlatList
              data={seasons}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isActive = item.id === selectedSeasonId;
                return (
                  <Pressable
                    className={`rounded-lg px-3 py-3 ${isActive ? "bg-green-100" : ""}`}
                    onPress={() => {
                      setActiveSelect(null);
                      dispatch(loadStandingsBySeason({ seasonId: item.id }));
                    }}
                  >
                    <Text className={`font-medium ${isActive ? "text-green-800" : "text-neutral-800"}`}>
                      {formatSeasonLabel(item.name)}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Points;