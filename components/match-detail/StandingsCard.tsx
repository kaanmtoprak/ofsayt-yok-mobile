import type {
  CompetitionTableData,
  CompetitionTableStandingRow,
  SeasonListItem,
} from "@/redux/slices/standings/service";
import { formatSeasonLabel } from "@/utilities/seasonLabel";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, Text, View } from "react-native";

const numCell = "w-8 text-center text-[12px] font-semibold text-neutral-700";

const rankBadgeClass = (rank: number) => {
  if (rank <= 4) return "bg-blue-600";
  if (rank >= 16) return "bg-red-600";
  return "bg-gray-200";
};

const rowKey = (row: CompetitionTableStandingRow, index: number): string => {
  const teamId = row.team?.id ?? row.team_id ?? "team";
  const name = row.team?.name ?? row.name ?? "unknown";
  return `${teamId}_${row.rank}_${name}_${index}`;
};

const flattenStandings = (tableData: CompetitionTableData | null): CompetitionTableStandingRow[] => {
  if (!tableData) return [];
  if (Array.isArray(tableData.table) && tableData.table.length) return tableData.table;
  if (!Array.isArray(tableData.stages)) return [];
  return tableData.stages.flatMap((stage) =>
    (stage.groups || []).flatMap((group) => (group.standings || []) as CompetitionTableStandingRow[])
  );
};

type Props = {
  data: CompetitionTableData | null;
  seasons: SeasonListItem[];
  selectedSeasonId: number | null;
  loading?: boolean;
  onSeasonChange?: (id: number) => void;
  onPressTeam?: (teamId: number) => void;
};

const StandingsCard = ({ data, seasons, selectedSeasonId, loading, onSeasonChange, onPressTeam }: Props) => {
  const [open, setOpen] = useState(false);
  const rows = useMemo(() => flattenStandings(data), [data]);
  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId) ?? null;
  const seasonLabel = selectedSeason ? formatSeasonLabel(selectedSeason.name) : "Sezon seç";

  return (
    <View className="rounded-2xl bg-white px-4 py-4 shadow-sm">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="flex-1 pr-2 text-base font-bold text-neutral-900" numberOfLines={1}>
          Puan Durumu
        </Text>
        <Pressable onPress={() => setOpen(true)} className="rounded-lg border border-neutral-300 px-2.5 py-1.5">
          <Text className="text-[10px] text-neutral-500">Sezon</Text>
          <Text className="text-xs font-semibold text-neutral-800">{seasonLabel}</Text>
        </Pressable>
      </View>

      {loading ? (
        <Text className="text-sm text-neutral-500">Puan durumu yükleniyor...</Text>
      ) : rows.length === 0 ? (
        <Text className="text-sm text-neutral-500">Puan tablosu yok.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View className="h-9 flex-row items-center border-b border-neutral-200 bg-neutral-50 px-2">
              <Text className="w-8 text-center text-[12px] font-bold text-neutral-600">#</Text>
              <Text className="w-40 text-[12px] font-bold text-neutral-600">Takım</Text>
              <Text className={numCell}>O</Text>
              <Text className={numCell}>G</Text>
              <Text className={numCell}>B</Text>
              <Text className={numCell}>M</Text>
              <Text className={numCell}>A</Text>
              <Text className={numCell}>Y</Text>
              <Text className={numCell}>Av</Text>
              <Text className="w-9 text-center text-[12px] font-bold text-green-700">P</Text>
            </View>
            {rows.map((row, index) => {
              const name = row.team?.name ?? row.name ?? "—";
              const logo = row.team?.logo ?? row.logo;
              const teamId = Number(row.team?.id ?? row.team_id ?? 0);
              return (
                <View key={rowKey(row, index)} className="h-10 flex-row items-center border-b border-neutral-100 px-2">
                  <View className={`h-6 w-6 items-center justify-center rounded-md ${rankBadgeClass(row.rank)}`}>
                    <Text className="text-[11px] font-bold text-white">{row.rank}</Text>
                  </View>
                  <Pressable
                    className="ml-2 w-40 flex-row items-center"
                    onPress={() => {
                      if (Number.isFinite(teamId) && teamId > 0) onPressTeam?.(teamId);
                    }}
                  >
                    {logo ? (
                      <Image source={{ uri: logo }} style={{ width: 14, height: 14, marginRight: 6 }} contentFit="contain" />
                    ) : null}
                    <Text className="flex-1 text-xs font-semibold text-neutral-900" numberOfLines={1}>
                      {name}
                    </Text>
                  </Pressable>
                  <Text className={numCell}>{row.matches}</Text>
                  <Text className={numCell}>{row.won}</Text>
                  <Text className={numCell}>{row.drawn}</Text>
                  <Text className={numCell}>{row.lost}</Text>
                  <Text className={numCell}>{row.goals_scored ?? "—"}</Text>
                  <Text className={numCell}>{row.goals_conceded ?? "—"}</Text>
                  <Text className={numCell}>{row.goal_diff}</Text>
                  <Text className="w-9 text-center text-xs font-bold text-green-700">{row.points}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/35">
          <View className="max-h-[70%] rounded-t-2xl bg-white px-4 pb-4 pt-3">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-neutral-900">Sezon Seç</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text className="text-sm font-semibold text-green-700">Kapat</Text>
              </Pressable>
            </View>
            <FlatList
              data={seasons}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const active = item.id === selectedSeasonId;
                return (
                  <Pressable
                    className={`rounded-lg px-3 py-3 ${active ? "bg-green-100" : ""}`}
                    onPress={() => {
                      setOpen(false);
                      onSeasonChange?.(item.id);
                    }}
                  >
                    <Text className={`font-medium ${active ? "text-green-800" : "text-neutral-800"}`}>
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

export default StandingsCard;
