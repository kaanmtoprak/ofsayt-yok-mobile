import { fetchLiveMatches } from "@/redux/slices/matches/actions";
import { refreshLiveFixtures } from "@/redux/slices/matches/actions";
import {
  groupMatchesByLeague,
  isLiveMatchOnSelectedDate,
  mergeMatchesForAllTab,
  sortGroupedMatchesForAllTab,
  type GroupedLeagueMatches,
} from "@/redux/slices/matches/service";
import { type ApiMatch } from "@/redux/slices/matches/matchesSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SectionList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- API (data.match[]) ---

// --- UI ---

type MatchStatus = "scheduled" | "live" | "finished";

type MatchRow = {
  id: string;
  matchId: number;
  kickoff: string;
  status: MatchStatus;
  liveMinute?: number;
  liveLabel?: string;
  home: { name: string; logo?: string };
  away: { name: string; logo?: string };
  score: { home: number; away: number } | null;
  ht: { home: number; away: number } | null;
};

type LeagueSection = {
  id: string;
  country: string;
  league: string;
  flag: string;
};

type TopFilter = "all" | "live" | "finished" | "favorites";

const TABS: { key: TopFilter; label: string }[] = [
  { key: "all", label: "Hepsi" },
  { key: "live", label: "Canlı" },
  { key: "finished", label: "Bitmiş" },
  { key: "favorites", label: "Favoriler" },
];

const BRAND = "#1BA76F";
const TR_MONTHS = [
  "Ocak",
  "Subat",
  "Mart",
  "Nisan",
  "Mayis",
  "Haziran",
  "Temmuz",
  "Agustos",
  "Eylul",
  "Ekim",
  "Kasim",
  "Aralik",
];
const TR_WEEKDAYS = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"];

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftIsoDate = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
};

const formatDateLabel = (isoDate: string): string => {
  const d = new Date(`${isoDate}T00:00:00`);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${TR_WEEKDAYS[d.getDay()]}`;
};

const FIFA_FLAG: Record<string, string> = {
  TUR: "🇹🇷",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  ESP: "🇪🇸",
  GER: "🇩🇪",
  ITA: "🇮🇹",
  FRA: "🇫🇷",
  NED: "🇳🇱",
  POR: "🇵🇹",
  AUS: "🇦🇺",
  NOR: "🇳🇴",
  SWE: "🇸🇪",
  DEN: "🇩🇰",
  FIN: "🇫🇮",
  POL: "🇵🇱",
  GRE: "🇬🇷",
  CRO: "🇭🇷",
  SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  BEL: "🇧🇪",
  RUS: "🇷🇺",
  UKR: "🇺🇦",
  CHN: "🇨🇳",
  JPN: "🇯🇵",
  RSA: "🇿🇦",
};

const flagForFifa = (code: string | undefined): string => {
  if (!code) return "⚽";
  return FIFA_FLAG[code.toUpperCase()] ?? "🌍";
};

const parseScoreString = (s: string | undefined | null): { home: number; away: number } | null => {
  if (s == null || s.trim() === "") return null;
  if (s.includes("?")) return null;
  const m = s.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return null;
  return { home: Number(m[1]), away: Number(m[2]) };
};

const mapApiStatus = (apiStatus?: string): MatchStatus => {
  const s = (apiStatus ?? "").toUpperCase();
  if (s === "FINISHED" || s === "FT" || s === "FULL TIME") return "finished";
  if (s === "NOT STARTED" || s === "NS" || s === "SCHEDULED") return "scheduled";
  if (
    s === "IN PLAY" ||
    s === "ADDED TIME" ||
    s === "HALF TIME BREAK" ||
    s === "LIVE" ||
    s === "1H" ||
    s === "2H" ||
    s === "HT"
  ) {
    return "live";
  }
  return "scheduled";
};

const liveDisplay = (time?: string, status?: string): { minute?: number; label?: string } => {
  const st = (status ?? "").toUpperCase();
  const t = time ?? "";
  if (st === "HALF TIME BREAK" || t === "HT") return { label: "İY" };
  if (!t || t === "FT" || t === "-") return {};
  if (/^\d+$/.test(t)) return { minute: Number(t), label: `${t}'` };
  if (/^\d+\+?$/.test(t) || t.includes("+")) return { label: `${t}'` };
  return { label: t };
};

const apiMatchToRow = (m: ApiMatch): MatchRow => {
  const status = mapApiStatus(m.status);
  const liveInfo =
    status === "live" ? liveDisplay(m.time, m.status) : ({} as { minute?: number; label?: string });
  const score = parseScoreString(m.scores?.score ?? m.score);
  const ht = parseScoreString(m.scores?.ht_score ?? m.ht_score);

  return {
    id: `${String(m.id)}_${String(m.competition?.id ?? m.competition_name ?? 0)}`,
    matchId: Number(m.id),
    kickoff: m.scheduled ?? m.time ?? "—",
    status,
    liveMinute: liveInfo.minute,
    liveLabel: liveInfo.label,
    home: {
      name: m.home?.name ?? m.home_name ?? "—",
      logo: m.home?.logo || undefined,
    },
    away: {
      name: m.away?.name ?? m.away_name ?? "—",
      logo: m.away?.logo || undefined,
    },
    score,
    ht,
  };
};

const LeagueHeader = ({ section }: { section: LeagueSection }) => (
  <View className="flex-row items-center border-b border-neutral-200 bg-neutral-100 px-3 py-2">
    <Text className="mr-2 text-lg">{section.flag}</Text>
    <Text className="flex-1 text-sm font-bold text-neutral-900" numberOfLines={1}>
      {section.country} — {section.league}
    </Text>
  </View>
);

const TeamBlock = ({
  align,
  strong,
  name,
  logo,
}: {
  align: "left" | "right";
  strong: boolean;
  name: string;
  logo?: string;
}) => {
  const nameCls = `flex-1 text-[13px] leading-tight ${align === "right" ? "text-right" : "text-left"} ${strong ? "font-bold text-neutral-900" : "font-medium text-neutral-600"}`;
  if (align === "right") {
    return (
      <View className="min-w-0 flex-1 flex-row items-center justify-end pr-1">
        {logo ? (
          <Image source={{ uri: logo }} style={{ width: 22, height: 22, marginRight: 8 }} contentFit="contain" />
        ) : null}
        <Text className={nameCls} numberOfLines={2} ellipsizeMode="tail">
          {name}
        </Text>
      </View>
    );
  }
  return (
    <View className="min-w-0 flex-1 flex-row items-center justify-start pl-1">
      <Text className={nameCls} numberOfLines={2} ellipsizeMode="tail">
        {name}
      </Text>
      {logo ? (
        <Image source={{ uri: logo }} style={{ width: 22, height: 22, marginLeft: 8 }} contentFit="contain" />
      ) : null}
    </View>
  );
};

const MatchRowView = ({ item, onPress }: { item: MatchRow; onPress?: () => void }) => {
  const { kickoff, status, liveMinute, liveLabel, home, away, score: sc, ht } = item;
  const htText = ht == null ? "—" : `${ht.home}-${ht.away}`;
  const hasScore = sc != null;
  let homeStrong = false;
  let awayStrong = false;
  if (hasScore && sc) {
    if (sc.home > sc.away) homeStrong = true;
    else if (sc.away > sc.home) awayStrong = true;
    else {
      homeStrong = true;
      awayStrong = true;
    }
  }

  const liveText = liveLabel ?? (liveMinute != null ? `${liveMinute}'` : "CANLI");

  const statusBlock =
    status === "live" ? (
      <View className="flex-row items-center rounded-full bg-emerald-50 px-2.5 py-1">
        <View className="mr-1.5 h-2 w-2 rounded-full bg-red-500" />
        <Text className="text-[11px] font-bold" style={{ color: BRAND }}>
          {liveText}
        </Text>
      </View>
    ) : status === "finished" ? (
      <View className="rounded-full bg-neutral-100 px-2.5 py-1">
        <Text className="text-[11px] font-bold text-neutral-500">MS</Text>
      </View>
    ) : (
      <View className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">
        <Text className="text-[11px] font-semibold text-neutral-500">Yakında</Text>
      </View>
    );

  return (
    <Pressable
      onPress={onPress}
      className="mx-3 mb-2 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"
    >
      <View className="border-b border-neutral-50 px-3.5 pb-2.5 pt-3">
        <View className="flex-row items-center justify-between">
          <View className="rounded-lg bg-neutral-100 px-2.5 py-1">
            <Text className="text-xs font-bold tabular-nums text-neutral-700">{kickoff}</Text>
          </View>
          {statusBlock}
        </View>
      </View>

      <View className="px-3 pb-3 pt-1">
        <View className="flex-row items-center">
          <TeamBlock align="right" strong={homeStrong} name={home.name} logo={home.logo} />
          <View className="w-[108px] shrink-0 items-center px-1">
            <Text
              className={`text-center text-xl font-black tabular-nums tracking-tight ${hasScore ? "text-neutral-900" : "text-neutral-300"}`}
            >
              {hasScore && sc ? `${sc.home} - ${sc.away}` : "—"}
            </Text>
            <Text className="mt-1 text-center text-[10px] font-medium text-neutral-400">
              İY {htText}
            </Text>
          </View>
          <TeamBlock align="left" strong={awayStrong} name={away.name} logo={away.logo} />
        </View>
      </View>
    </Pressable>
  );
};

type Section = { title: string; league: LeagueSection; data: MatchRow[] };

const MatchesScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState<TopFilter>("all");
  const [selectedDate, setSelectedDate] = useState<string>(() => toIsoDate(new Date()));
  const historyMatches = useAppSelector((state) => state.matches.historyList);
  const liveMatches = useAppSelector((state) => state.matches.liveList);
  const fixtureMatches = useAppSelector((state) => state.matches.fixtureList);
  const loading = useAppSelector((state) => state.matches.loading);
  const error = useAppSelector((state) => state.matches.error);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    dispatch(fetchLiveMatches({ date: selectedDate }));
  }, [dispatch, selectedDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(refreshLiveFixtures({ date: selectedDate }));
    }, 30_000);
    return () => clearInterval(interval);
  }, [dispatch, selectedDate]);

  const displayMatches = useMemo((): ApiMatch[] => {
    if (filter === "favorites") return [];
    if (filter === "live") {
      return liveMatches.filter(
        (m) =>
          (m.status === "IN PLAY" || m.status === "HALF TIME BREAK") &&
          isLiveMatchOnSelectedDate(m, selectedDate)
      );
    }
    if (filter === "finished") {
      return historyMatches.filter((m) => m.status === "FINISHED");
    }
    return mergeMatchesForAllTab({
      selectedDate,
      historyPageMatches: historyMatches,
      liveMatches,
      fixtures: fixtureMatches,
    });
  }, [filter, fixtureMatches, historyMatches, liveMatches, selectedDate]);

  const grouped = useMemo((): GroupedLeagueMatches[] => {
    const raw = groupMatchesByLeague(displayMatches);
    return filter === "all" ? sortGroupedMatchesForAllTab(raw) : raw;
  }, [displayMatches, filter]);

  const sections = useMemo((): Section[] => {
    return grouped.map((g) => {
      const code = g.country_flag?.replace(/\.[a-z]+$/i, "") || "";
      const league: LeagueSection = {
        id: `${g.competition_id}`,
        country: g.country_name ?? "Uluslararası",
        league: g.competition_name || "Lig",
        flag: flagForFifa(code),
      };
      return {
        title: league.id,
        league,
        data: g.matches.map(apiMatchToRow),
      };
    });
  }, [grouped]);

  const listBottom = 32 + Math.max(insets.bottom, 8);

  return (
    <View className="flex-1 bg-neutral-50">
      <View className="flex-row border-b border-neutral-200 bg-white px-1">
        {TABS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              className={`flex-1 py-3 ${active ? "border-b-2 border-[#1BA76F]" : ""}`}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  active ? "text-[#1BA76F]" : "text-neutral-500"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <Pressable onPress={() => setSelectedDate((prev) => shiftIsoDate(prev, -1))} className="px-2 py-1">
          <Text className="text-lg text-neutral-700">{"<"}</Text>
        </Pressable>
        <Text className="text-xl font-bold text-neutral-900">{formatDateLabel(selectedDate)}</Text>
        <Pressable onPress={() => setSelectedDate((prev) => shiftIsoDate(prev, 1))} className="px-2 py-1">
          <Text className="text-lg text-neutral-700">{">"}</Text>
        </Pressable>
      </View>

      {filter === "favorites" ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-neutral-500">
            Favori maçların burada listelenecek.
          </Text>
        </View>
      ) : (
        <SectionList
          style={{ flex: 1 }}
          sections={sections}
          keyExtractor={({ id }) => id}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => <LeagueHeader section={section.league} />}
          renderItem={({ item }) => (
            <MatchRowView
              item={item}
              onPress={() => {
                if (!Number.isFinite(item.matchId) || item.matchId <= 0) return;
                router.push(`/matches/${item.matchId}`);
              }}
            />
          )}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: listBottom }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 py-16">
              <Text className="text-center text-neutral-500">
                {loading
                  ? "Maçlar yükleniyor..."
                  : error ??
                    "Bu filtre için maç yok veya veri yüklenemedi. Backend endpoint: /api/livescore/matches/live?page=1"}
              </Text>
              {loading ? <ActivityIndicator className="mt-3" color={BRAND} /> : null}
            </View>
          }
        />
      )}
    </View>
  );
};

export default MatchesScreen;
