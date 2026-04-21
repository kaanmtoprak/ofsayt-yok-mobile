import type { ApiMatch } from "@/redux/slices/matches/matchesSlice";
import {
  getLeagueTable,
  getTeamCompetitions,
  getTeamLastMatches,
  getTeamSquads,
  type MiniTableRow,
  type SquadPlayer,
  type TeamCompetition,
} from "@/services/teamDetailApi";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TeamTab = "matches" | "squad";

const parseScore = (raw?: string): string => raw?.trim() || "—";

const teamNameFromMatches = (matches: ApiMatch[], teamId: string): string => {
  if (!matches.length) return "Takım Detayı";
  const first = matches.find(
    (m) => String(m.home?.id ?? "") === teamId || String(m.away?.id ?? "") === teamId
  );
  if (!first) return "Takım Detayı";
  if (String(first.home?.id ?? "") === teamId) return first.home?.name ?? "Takım";
  return first.away?.name ?? "Takım";
};

const teamLogoFromMatches = (matches: ApiMatch[], teamId: string): string | undefined => {
  const first = matches.find(
    (m) => String(m.home?.id ?? "") === teamId || String(m.away?.id ?? "") === teamId
  );
  if (!first) return undefined;
  if (String(first.home?.id ?? "") === teamId) return first.home?.logo;
  return first.away?.logo;
};

const TeamDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const teamId = Array.isArray(id) ? id[0] : id;
  const insets = useSafeAreaInsets();
  const requestRef = useRef(0);
  const compRequestRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TeamTab>("matches");
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [competitions, setCompetitions] = useState<TeamCompetition[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>("");
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [tableRows, setTableRows] = useState<MiniTableRow[]>([]);
  const [compLoading, setCompLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const teamName = useMemo(() => (teamId ? teamNameFromMatches(matches, teamId) : "Takım Detayı"), [matches, teamId]);
  const teamLogo = useMemo(() => (teamId ? teamLogoFromMatches(matches, teamId) : undefined), [matches, teamId]);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      setError("Takım bulunamadı.");
      return;
    }
    const requestId = ++requestRef.current;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      setMatches([]);
      setCompetitions([]);
      setSelectedCompetitionId("");
      setSquad([]);
      setTableRows([]);

      const lastMatches = await getTeamLastMatches(teamId, 10);
      if (cancelled || requestRef.current !== requestId) return;

      const compList = getTeamCompetitions(lastMatches, teamId);
      setMatches(lastMatches);
      setCompetitions(compList);
      if (compList.length) {
        setSelectedCompetitionId(String(compList[0].id));
      }
      setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  useEffect(() => {
    if (!teamId || !selectedCompetitionId) {
      setSquad([]);
      setTableRows([]);
      return;
    }

    const requestId = ++compRequestRef.current;
    let cancelled = false;

    const run = async () => {
      setCompLoading(true);
      const [squadData, tableData] = await Promise.all([
        getTeamSquads(teamId, selectedCompetitionId),
        getLeagueTable(selectedCompetitionId),
      ]);
      if (cancelled || compRequestRef.current !== requestId) return;
      setSquad(squadData);
      setTableRows(tableData);
      setCompLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedCompetitionId, teamId]);

  return (
    <View className="flex-1 bg-[#F6F7F9]">
      <View style={{ paddingTop: Math.max(insets.top, 8) }} className="px-4 pb-3 pt-2">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="rounded-full bg-white px-3 py-1.5 shadow-sm">
            <Text className="text-sm font-semibold text-neutral-700">Geri</Text>
          </Pressable>
          <Text className="ml-3 text-lg font-bold text-neutral-900">Takım Detayı</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="mt-2 text-sm text-neutral-500">Takım verileri yükleniyor...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-neutral-600">{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <View className="rounded-2xl bg-white px-4 py-4 shadow-sm">
            <View className="flex-row items-center">
              {teamLogo ? (
                <Image source={{ uri: teamLogo }} style={{ width: 46, height: 46 }} contentFit="contain" />
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-200">
                  <Text className="text-sm font-bold text-neutral-600">{teamName.slice(0, 1)}</Text>
                </View>
              )}
              <Text className="ml-3 flex-1 text-lg font-bold text-neutral-900" numberOfLines={2}>
                {teamName}
              </Text>
            </View>

            <View className="mt-4">
              <Text className="mb-1 text-xs text-neutral-500">Lig</Text>
              <Pressable
                onPress={() => setPickerOpen(true)}
                className="rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2"
              >
                <Text className="text-sm font-semibold text-neutral-800" numberOfLines={1}>
                  {competitions.find((c) => String(c.id) === selectedCompetitionId)?.name ?? "Lig seç"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="mt-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
            <View className="mb-3 flex-row rounded-xl bg-neutral-100 p-1">
              <Pressable
                onPress={() => setActiveTab("matches")}
                className={`flex-1 rounded-lg py-2 ${activeTab === "matches" ? "bg-white" : ""}`}
              >
                <Text className={`text-center text-sm font-semibold ${activeTab === "matches" ? "text-green-700" : "text-neutral-600"}`}>
                  Son Maçlar
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("squad")}
                className={`flex-1 rounded-lg py-2 ${activeTab === "squad" ? "bg-white" : ""}`}
              >
                <Text className={`text-center text-sm font-semibold ${activeTab === "squad" ? "text-green-700" : "text-neutral-600"}`}>
                  Kadro
                </Text>
              </Pressable>
            </View>

            {activeTab === "matches" ? (
              matches.length === 0 ? (
                <Text className="text-sm text-neutral-500">Son maç bulunamadı.</Text>
              ) : (
                matches.map((m, i) => (
                  <Pressable
                    key={`${m.id}_${i}`}
                    className="mb-2 flex-row items-center rounded-xl bg-neutral-50 px-3 py-2"
                    onPress={() => {
                      const matchId = Number(m.id);
                      if (!Number.isFinite(matchId) || matchId <= 0) return;
                      router.push({ pathname: "/matches/[id]", params: { id: String(matchId) } });
                    }}
                  >
                    <Text className="w-14 text-[11px] text-neutral-500">{m.scheduled ?? m.time ?? "—"}</Text>
                    <Text numberOfLines={1} className="flex-1 text-xs font-medium text-neutral-800">
                      {m.home?.name ?? m.home_name ?? "Ev"}
                    </Text>
                    <Text className="mx-2 w-14 text-center text-xs font-bold text-neutral-900">
                      {parseScore(m.scores?.score ?? m.score)}
                    </Text>
                    <Text numberOfLines={1} className="flex-1 text-right text-xs font-medium text-neutral-800">
                      {m.away?.name ?? m.away_name ?? "Dep"}
                    </Text>
                  </Pressable>
                ))
              )
            ) : squad.length === 0 ? (
              <Text className="text-sm text-neutral-500">Kadro bilgisi bulunamadı.</Text>
            ) : (
              squad.map((p, i) => (
                <View key={`${p.id ?? p.name ?? i}`} className="mb-2 flex-row items-center rounded-xl bg-neutral-50 px-3 py-2">
                  <Text className="mr-2 w-8 text-center text-xs font-bold text-neutral-500">
                    {p.shirt_number ?? "-"}
                  </Text>
                  <Text className="flex-1 text-sm font-medium text-neutral-800">{p.name ?? "Oyuncu"}</Text>
                </View>
              ))
            )}
          </View>

          <View className="mt-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
            <Text className="mb-2 text-base font-bold text-neutral-900">Puan Durumu</Text>
            {compLoading ? (
              <Text className="text-sm text-neutral-500">Puan durumu güncelleniyor...</Text>
            ) : tableRows.length === 0 ? (
              <Text className="text-sm text-neutral-500">Puan durumu bulunamadı.</Text>
            ) : (
              <>
                <View className="mb-1 flex-row border-b border-neutral-200 pb-2">
                  <Text className="w-8 text-center text-[11px] font-bold text-neutral-500">S</Text>
                  <Text className="flex-1 text-[11px] font-bold text-neutral-500">Takım</Text>
                  <Text className="w-8 text-center text-[11px] font-bold text-neutral-500">O</Text>
                  <Text className="w-8 text-center text-[11px] font-bold text-green-700">P</Text>
                </View>
                {tableRows.slice(0, 10).map((row, index) => {
                  const rowTeamId = String(row.team?.id ?? row.team_id ?? "");
                  const rowName = row.team?.name ?? row.name ?? "—";
                  const isCurrentTeam = rowTeamId === teamId;
                  return (
                    <Pressable
                      key={`${rowTeamId}_${row.rank}_${index}`}
                      className={`mb-1 flex-row items-center rounded-lg px-2 py-2 ${isCurrentTeam ? "bg-green-100" : "bg-neutral-50"}`}
                      onPress={() => {
                        if (!rowTeamId) return;
                        router.push({ pathname: "/teams/[id]", params: { id: rowTeamId } });
                      }}
                    >
                      <Text className="w-8 text-center text-xs font-semibold text-neutral-700">{row.rank}</Text>
                      <Text numberOfLines={1} className="flex-1 text-xs font-medium text-neutral-800">
                        {rowName}
                      </Text>
                      <Text className="w-8 text-center text-xs text-neutral-700">{row.matches}</Text>
                      <Text className="w-8 text-center text-xs font-bold text-green-700">{row.points}</Text>
                    </Pressable>
                  );
                })}
              </>
            )}
          </View>
        </ScrollView>
      )}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View className="flex-1 justify-end bg-black/35">
          <View className="max-h-[70%] rounded-t-2xl bg-white px-4 pb-4 pt-3">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-neutral-900">Lig Seç</Text>
              <Pressable onPress={() => setPickerOpen(false)}>
                <Text className="text-sm font-semibold text-green-700">Kapat</Text>
              </Pressable>
            </View>
            <FlatList
              data={competitions}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const active = String(item.id) === selectedCompetitionId;
                return (
                  <Pressable
                    className={`rounded-lg px-3 py-3 ${active ? "bg-green-100" : ""}`}
                    onPress={() => {
                      setPickerOpen(false);
                      setSelectedCompetitionId(String(item.id));
                    }}
                  >
                    <Text className={`font-medium ${active ? "text-green-800" : "text-neutral-800"}`}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text className="text-sm text-neutral-500">Lig bulunamadı.</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TeamDetailScreen;
