import type { MatchEvent } from "@/services/matchDetailApi";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

const EVENT_ICONS: Record<string, string> = {
  GOAL: "⚽",
  YELLOW_CARD: "🟨",
  RED_CARD: "🟥",
  SUBSTITUTION: "🔄",
};

const EventsCard = ({ events }: { events: MatchEvent[] }) => {
  const sorted = useMemo(() => [...events].sort((a, b) => (a.time ?? 0) - (b.time ?? 0)), [events]);

  return (
    <View className="rounded-2xl bg-white px-4 py-4 shadow-sm">
      <Text className="mb-3 text-base font-bold text-neutral-900">Maç Olayları</Text>
      {sorted.length === 0 ? (
        <Text className="text-sm text-neutral-500">Maç olayı bulunmuyor.</Text>
      ) : (
        <View className="gap-2">
          {sorted.map((event, i) => {
            const icon = EVENT_ICONS[event.event] ?? "📋";
            const playerName = event.player?.name ?? "Oyuncu";
            const isHome = Boolean(event.is_home);
            return (
              <View
                key={`${event.id}_${i}`}
                className={`flex-row items-center rounded-xl px-3 py-2 ${
                  isHome ? "bg-emerald-50" : "bg-blue-50"
                }`}
              >
                {isHome ? (
                  <>
                    <View className="flex-1">
                      <Text className="text-right text-xs font-semibold text-neutral-800">{playerName}</Text>
                    </View>
                    <Text className="mx-2 text-xs">{icon}</Text>
                    <Text className="w-12 text-center text-xs font-bold text-neutral-700">{event.time}'</Text>
                  </>
                ) : (
                  <>
                    <Text className="w-12 text-center text-xs font-bold text-neutral-700">{event.time}'</Text>
                    <Text className="mx-2 text-xs">{icon}</Text>
                    <View className="flex-1">
                      <Text className="text-left text-xs font-semibold text-neutral-800">{playerName}</Text>
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default EventsCard;
