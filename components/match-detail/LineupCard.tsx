import type { LineupPlayer, MatchLineupData } from "@/services/matchDetailApi";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

const starterList = (players?: LineupPlayer[]): LineupPlayer[] => {
  if (!Array.isArray(players)) return [];
  return players.filter((p) => String(p.substitution ?? "0") === "0");
};

const PlayerRow = ({ player }: { player: LineupPlayer }) => (
  <View className="mb-1 flex-row items-center rounded-lg bg-neutral-50 px-2 py-1.5">
    <Text className="mr-2 w-6 text-center text-[11px] font-bold text-neutral-500">
      {player.shirt_number ?? "—"}
    </Text>
    <Text numberOfLines={1} className="flex-1 text-xs font-medium text-neutral-800">
      {player.name ?? "Oyuncu"}
    </Text>
  </View>
);

const LineupCard = ({ lineups }: { lineups: MatchLineupData | null }) => {
  const homeData = lineups?.lineup?.home;
  const awayData = lineups?.lineup?.away;
  const homeStarters = useMemo(() => starterList(homeData?.players), [homeData?.players]);
  const awayStarters = useMemo(() => starterList(awayData?.players), [awayData?.players]);

  if (!homeData && !awayData) {
    return (
      <View className="rounded-2xl bg-white px-4 py-4 shadow-sm">
        <Text className="mb-1 text-base font-bold text-neutral-900">İlk 11</Text>
        <Text className="text-sm text-neutral-500">Kadrolar henüz açıklanmadı.</Text>
      </View>
    );
  }

  return (
    <View className="rounded-2xl bg-white px-4 py-4 shadow-sm">
      <Text className="mb-3 text-base font-bold text-neutral-900">İlk 11</Text>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Text className="mb-2 text-center text-xs font-semibold text-neutral-600">
            {homeData?.team?.name ?? "Ev Sahibi"}
          </Text>
          {homeStarters.length === 0 ? (
            <Text className="text-center text-xs text-neutral-500">Açıklanmadı</Text>
          ) : (
            homeStarters.map((player, i) => <PlayerRow key={`${player.id ?? player.name ?? i}_h`} player={player} />)
          )}
        </View>

        <View className="flex-1">
          <Text className="mb-2 text-center text-xs font-semibold text-neutral-600">
            {awayData?.team?.name ?? "Deplasman"}
          </Text>
          {awayStarters.length === 0 ? (
            <Text className="text-center text-xs text-neutral-500">Açıklanmadı</Text>
          ) : (
            awayStarters.map((player, i) => <PlayerRow key={`${player.id ?? player.name ?? i}_a`} player={player} />)
          )}
        </View>
      </View>
    </View>
  );
};

export default LineupCard;
