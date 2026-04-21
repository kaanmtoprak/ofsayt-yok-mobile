import type { MatchStatsData } from "@/services/matchDetailApi";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

const STAT_LABELS: Record<string, string> = {
  possesion: "Topa Sahip Olma",
  shots_on_target: "İsabetli Şut",
  shots_off_target: "İsabetsiz Şut",
  attempts_on_goal: "Toplam Şut",
  corners: "Korner",
  offsides: "Ofsayt",
  fauls: "Faul",
  yellow_cards: "Sarı Kart",
  red_cards: "Kırmızı Kart",
  saves: "Kurtarış",
  shots_blocked: "Blok",
  free_kicks: "Serbest Vuruş",
  goal_kicks: "Aut Atışı",
  throw_ins: "Taç Atışı",
  dangerous_attacks: "Tehlikeli Atak",
  attacks: "Atak",
};

type StatRow = {
  key: string;
  label: string;
  home: string;
  away: string;
  homeNum: number;
  awayNum: number;
};

const toNumber = (raw: string): number => {
  const clean = raw.replace(/[^\d.-]/g, "");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
};

const StatsCard = ({ stats }: { stats: MatchStatsData | null }) => {
  const rows = useMemo((): StatRow[] => {
    if (!stats) return [];
    return Object.entries(stats)
      .filter(([, value]) => value != null)
      .map(([key, value]) => {
        const str = String(value);
        const [h = "0", a = "0"] = str.split(":").map((v) => v.trim());
        return {
          key,
          label: STAT_LABELS[key] ?? key,
          home: h,
          away: a,
          homeNum: toNumber(h),
          awayNum: toNumber(a),
        };
      });
  }, [stats]);

  return (
    <View className="rounded-2xl bg-white px-4 py-4 shadow-sm">
      <Text className="mb-3 text-base font-bold text-neutral-900">Maç İstatistikleri</Text>
      {rows.length === 0 ? (
        <Text className="text-sm text-neutral-500">İstatistik verisi bulunmuyor.</Text>
      ) : (
        <View className="gap-3">
          {rows.map((row) => {
            const total = row.homeNum + row.awayNum;
            const homePct = total > 0 ? Math.max(0, Math.min(100, (row.homeNum / total) * 100)) : 50;
            return (
              <View key={row.key}>
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="w-12 text-left text-xs font-semibold text-neutral-800">{row.home}</Text>
                  <Text className="flex-1 px-2 text-center text-xs text-neutral-500">{row.label}</Text>
                  <Text className="w-12 text-right text-xs font-semibold text-neutral-800">{row.away}</Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-neutral-200">
                  <View className="h-2 bg-emerald-500" style={{ width: `${homePct}%` }} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default StatsCard;
