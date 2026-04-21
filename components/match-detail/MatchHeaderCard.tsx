import type { ApiMatch } from "@/redux/slices/matches/matchesSlice";
import { Image } from "expo-image";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

const parseScore = (raw?: string): { home: string; away: string } => {
  if (!raw?.trim()) return { home: "—", away: "—" };
  const m = raw.trim().match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (!m) return { home: raw.trim(), away: "—" };
  return { home: m[1].trim(), away: m[2].trim() };
};

const normalizeStatus = (status?: string): { text: string; bg: string; fg: string } => {
  const s = (status ?? "").toUpperCase();
  if (s === "IN PLAY" || s === "HALF TIME BREAK") {
    return { text: s === "HALF TIME BREAK" ? "Devre Arası" : "Canlı", bg: "bg-emerald-100", fg: "text-emerald-700" };
  }
  if (s === "FINISHED") return { text: "Bitti", bg: "bg-neutral-200", fg: "text-neutral-700" };
  return { text: "Yakında", bg: "bg-blue-100", fg: "text-blue-700" };
};

const formatDateTime = (match: ApiMatch | null): string => {
  if (!match) return "Tarih bilgisi yok";
  const date = match.date?.trim();
  const time = match.scheduled?.trim() || match.time?.trim();
  if (date && time) return `${date} ${time}`;
  if (date) return date;
  if (time) return time;
  return "Tarih bilgisi yok";
};

type Props = {
  match: ApiMatch | null;
  onPressHomeTeam?: (teamId: number) => void;
  onPressAwayTeam?: (teamId: number) => void;
};

const MatchHeaderCard = ({ match, onPressHomeTeam, onPressAwayTeam }: Props) => {
  const score = useMemo(() => parseScore(match?.scores?.score ?? match?.score), [match]);
  const ht = useMemo(() => parseScore(match?.scores?.ht_score ?? match?.ht_score), [match]);
  const status = normalizeStatus(match?.status);

  const homeName = match?.home?.name ?? match?.home_name ?? "Ev Sahibi";
  const awayName = match?.away?.name ?? match?.away_name ?? "Deplasman";
  const homeLogo = match?.home?.logo;
  const awayLogo = match?.away?.logo;
  const homeId = Number(match?.home?.id ?? 0);
  const awayId = Number(match?.away?.id ?? 0);
  const leagueName = match?.competition?.name ?? match?.competition_name ?? "Lig";
  const countryName = typeof match?.country === "string" ? match.country : match?.country?.name ?? "Uluslararası";

  return (
    <View className="rounded-2xl bg-white px-4 py-4 shadow-sm">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="flex-1 pr-2 text-xs font-semibold text-neutral-500" numberOfLines={1}>
          {countryName} - {leagueName}
        </Text>
        <View className={`rounded-full px-2.5 py-1 ${status.bg}`}>
          <Text className={`text-[11px] font-semibold ${status.fg}`}>{status.text}</Text>
        </View>
      </View>

      <Text className="mb-4 text-xs text-neutral-500">{formatDateTime(match)}</Text>

      <View className="flex-row items-center">
        <Pressable
          className="flex-1 items-center"
          onPress={() => {
            if (Number.isFinite(homeId) && homeId > 0) onPressHomeTeam?.(homeId);
          }}
        >
          {homeLogo ? (
            <Image source={{ uri: homeLogo }} style={{ width: 44, height: 44 }} contentFit="contain" />
          ) : (
            <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-200">
              <Text className="text-sm font-bold text-neutral-600">{homeName.slice(0, 1)}</Text>
            </View>
          )}
          <Text className="mt-2 text-center text-sm font-semibold text-neutral-900" numberOfLines={2}>
            {homeName}
          </Text>
        </Pressable>

        <View className="w-[120px] items-center px-2">
          <Text className="text-3xl font-black tracking-tight text-neutral-900">
            {score.home} - {score.away}
          </Text>
          <Text className="mt-1 text-xs text-neutral-500">
            İY {ht.home} - {ht.away}
          </Text>
        </View>

        <Pressable
          className="flex-1 items-center"
          onPress={() => {
            if (Number.isFinite(awayId) && awayId > 0) onPressAwayTeam?.(awayId);
          }}
        >
          {awayLogo ? (
            <Image source={{ uri: awayLogo }} style={{ width: 44, height: 44 }} contentFit="contain" />
          ) : (
            <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-200">
              <Text className="text-sm font-bold text-neutral-600">{awayName.slice(0, 1)}</Text>
            </View>
          )}
          <Text className="mt-2 text-center text-sm font-semibold text-neutral-900" numberOfLines={2}>
            {awayName}
          </Text>
        </Pressable>
      </View>

      {(match?.location || match?.referee) && (
        <View className="mt-4 flex-row gap-2">
          <View className="flex-1 rounded-xl bg-neutral-100 px-3 py-2">
            <Text className="text-[11px] text-neutral-500">Stadyum</Text>
            <Text className="mt-0.5 text-xs font-semibold text-neutral-800">{match.location ?? "—"}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-neutral-100 px-3 py-2">
            <Text className="text-[11px] text-neutral-500">Hakem</Text>
            <Text className="mt-0.5 text-xs font-semibold text-neutral-800">{match.referee ?? "—"}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default MatchHeaderCard;
