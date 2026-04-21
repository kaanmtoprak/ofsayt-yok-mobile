export type LeagueGroupSortInput = {
  competition_id: number;
  competition_name: string;
  country_id?: number;
  country_name?: string;
};

export type SidebarLeague = {
  id: number;
  name: string;
  countryId: number | null;
  logo?: string;
};

export const SIDEBAR_LEAGUES: SidebarLeague[] = [
  { id: 6, name: "Trendyol Super Lig", countryId: 48 },
  { id: 344, name: "Trendyol 1. Lig", countryId: 48 },
  { id: 347, name: "Turkiye Kupasi", countryId: 48 },
  { id: 244, name: "Sampiyonlar Ligi", countryId: null },
  { id: 245, name: "UEFA Avrupa Ligi", countryId: null },
  { id: 446, name: "UEFA Konferans Ligi", countryId: null },
  { id: 2, name: "Ingiltere Premier Lig", countryId: 19 },
  { id: 1, name: "Almanya Bundesliga", countryId: 1 },
  { id: 3, name: "Ispanya La Liga", countryId: 43 },
  { id: 4, name: "Italya Serie A", countryId: 47 },
  { id: 5, name: "Fransa Ligue 1", countryId: 21 },
];

export const TURKEY_COUNTRY_ID = 48;
export const TURKEY_COMPETITION_IDS = [6, 344, 347];

export const UEFA_CHAMPIONS_LEAGUE_ID = 245;
export const UEFA_EUROPA_LEAGUE_ID = 244;
export const UEFA_CONFERENCE_LEAGUE_ID = 446;

export const UEFA_TIER2_COMPETITION_IDS = [
  UEFA_CHAMPIONS_LEAGUE_ID,
  UEFA_EUROPA_LEAGUE_ID,
  UEFA_CONFERENCE_LEAGUE_ID,
];

export const BIG_FIVE_COMPETITION_ORDER = [2, 1, 3, 4, 5];

const isTurkeyGroup = (g: LeagueGroupSortInput): boolean => {
  if (g.country_id === TURKEY_COUNTRY_ID) return true;
  const n = (g.country_name || "").toLowerCase();
  if (n === "turkey" || n === "turkiye") return true;
  return TURKEY_COMPETITION_IDS.includes(g.competition_id);
};

const turkeyLeagueOrder = (competitionId: number): number => {
  const i = TURKEY_COMPETITION_IDS.indexOf(competitionId);
  return i >= 0 ? i : 500;
};

const uefaTier2Order = (competitionId: number): number => {
  const i = UEFA_TIER2_COMPETITION_IDS.indexOf(competitionId);
  return i >= 0 ? i : 999;
};

const bigFiveOrder = (competitionId: number): number => {
  const i = BIG_FIVE_COMPETITION_ORDER.indexOf(competitionId);
  return i >= 0 ? i : 999;
};

const getTier = (g: LeagueGroupSortInput): number => {
  if (isTurkeyGroup(g)) return 1;
  if (uefaTier2Order(g.competition_id) < 999) return 2;
  if (bigFiveOrder(g.competition_id) < 999) return 3;
  return 4;
};

const nameCompare = (a: LeagueGroupSortInput, b: LeagueGroupSortInput): number => {
  return (a.competition_name || "").localeCompare(b.competition_name || "", "tr");
};

export const compareGroupedLeagues = (a: LeagueGroupSortInput, b: LeagueGroupSortInput): number => {
  const tierA = getTier(a);
  const tierB = getTier(b);
  if (tierA !== tierB) return tierA - tierB;

  if (tierA === 1) {
    const oa = turkeyLeagueOrder(a.competition_id);
    const ob = turkeyLeagueOrder(b.competition_id);
    if (oa !== ob) return oa - ob;
    return nameCompare(a, b);
  }

  if (tierA === 2) {
    const oa = uefaTier2Order(a.competition_id);
    const ob = uefaTier2Order(b.competition_id);
    if (oa !== ob) return oa - ob;
    return nameCompare(a, b);
  }

  if (tierA === 3) {
    const oa = bigFiveOrder(a.competition_id);
    const ob = bigFiveOrder(b.competition_id);
    if (oa !== ob) return oa - ob;
    return nameCompare(a, b);
  }

  const byCountry = (a.country_name || "").localeCompare(b.country_name || "", "tr");
  if (byCountry !== 0) return byCountry;
  return nameCompare(a, b);
};
