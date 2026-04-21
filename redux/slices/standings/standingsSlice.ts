import { SIDEBAR_LEAGUES } from "@/constants/leagues";
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import {
  getCompetitionTableFull,
  getSeasonsList,
  getTopScorers,
  type CompetitionTableData,
  type SeasonListItem,
  type TopScorersPayload,
} from "./service";

export type SidebarTab = "standings" | "leagues";

const DEFAULT_COMPETITION_ID = 6;

type StandingsState = {
  sidebarTab: SidebarTab;
  selectedCompetitionId: number;
  seasons: SeasonListItem[];
  selectedSeasonId: number | null;
  tableData: CompetitionTableData | null;
  topScorers: TopScorersPayload | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  currentRequestId: string | null;
};

const initialState: StandingsState = {
  sidebarTab: "standings",
  selectedCompetitionId: DEFAULT_COMPETITION_ID,
  seasons: [],
  selectedSeasonId: null,
  tableData: null,
  topScorers: null,
  loading: false,
  error: null,
  initialized: false,
  currentRequestId: null,
};

const findCurrentSeasonCandidate = (seasons: SeasonListItem[]): number | null => {
  if (!seasons.length) return null;
  const thisYear = new Date().getFullYear();
  const current = seasons.find((s) => {
    const n = s.name.trim();
    if (/^\d{4}$/.test(n)) return Number(n) === thisYear;
    const m = /^(\d{4})\s*\/\s*(\d{4})$/.exec(n);
    if (!m) return false;
    const a = Number(m[1]);
    const b = Number(m[2]);
    return thisYear === a || thisYear === b;
  });
  return current?.id ?? seasons[0]!.id;
};

const resolveSeasonId = ({
  seasons,
  tableData,
  preferredSeasonId,
}: {
  seasons: SeasonListItem[];
  tableData: CompetitionTableData | null;
  preferredSeasonId: number | null;
}): number | null => {
  const fromTable =
    tableData?.season?.id != null && Number.isFinite(Number(tableData.season.id))
      ? Number(tableData.season.id)
      : null;

  if (fromTable != null && seasons.some((s) => s.id === fromTable)) return fromTable;
  if (preferredSeasonId != null && seasons.some((s) => s.id === preferredSeasonId)) return preferredSeasonId;
  return findCurrentSeasonCandidate(seasons);
};

type LoadStandingsPayload = {
  selectedCompetitionId: number;
  seasons: SeasonListItem[];
  selectedSeasonId: number | null;
  tableData: CompetitionTableData | null;
  topScorers: TopScorersPayload | null;
};

export const loadStandingsInitial = createAsyncThunk<LoadStandingsPayload, void, { rejectValue: string }>(
  "standings/loadInitial",
  async (_, thunkApi) => {
    try {
      const selectedCompetitionId =
        SIDEBAR_LEAGUES.find((l) => l.id === DEFAULT_COMPETITION_ID)?.id ?? DEFAULT_COMPETITION_ID;

      const [seasons, firstTable] = await Promise.all([
        getSeasonsList(),
        getCompetitionTableFull(selectedCompetitionId),
      ]);

      const selectedSeasonId = resolveSeasonId({
        seasons,
        tableData: firstTable,
        preferredSeasonId: null,
      });

      let tableData = firstTable;
      if (
        selectedSeasonId != null &&
        (firstTable?.season?.id == null || Number(firstTable.season.id) !== selectedSeasonId)
      ) {
        tableData = await getCompetitionTableFull(selectedCompetitionId, { season: selectedSeasonId });
      }

      const topScorers = await getTopScorers(
        selectedCompetitionId,
        selectedSeasonId != null ? { season: selectedSeasonId } : undefined
      );

      return { selectedCompetitionId, seasons, selectedSeasonId, tableData, topScorers };
    } catch (e) {
      return thunkApi.rejectWithValue(e instanceof Error ? e.message : "Puan durumu yuklenemedi.");
    }
  }
);

export const loadStandingsByCompetition = createAsyncThunk<
  LoadStandingsPayload,
  { competitionId: number },
  { state: RootState; rejectValue: string }
>("standings/loadByCompetition", async ({ competitionId }, thunkApi) => {
  try {
    const state = thunkApi.getState().standings;
    const seasons = state.seasons.length ? state.seasons : await getSeasonsList();
    const firstTable = await getCompetitionTableFull(competitionId);
    const selectedSeasonId = resolveSeasonId({
      seasons,
      tableData: firstTable,
      preferredSeasonId: state.selectedSeasonId,
    });

    let tableData = firstTable;
    if (
      selectedSeasonId != null &&
      (firstTable?.season?.id == null || Number(firstTable.season.id) !== selectedSeasonId)
    ) {
      tableData = await getCompetitionTableFull(competitionId, { season: selectedSeasonId });
    }

    const topScorers = await getTopScorers(
      competitionId,
      selectedSeasonId != null ? { season: selectedSeasonId } : undefined
    );

    return {
      selectedCompetitionId: competitionId,
      seasons,
      selectedSeasonId,
      tableData,
      topScorers,
    };
  } catch (e) {
    return thunkApi.rejectWithValue(e instanceof Error ? e.message : "Lig puan durumu yuklenemedi.");
  }
});

export const loadStandingsBySeason = createAsyncThunk<
  { selectedSeasonId: number; tableData: CompetitionTableData | null; topScorers: TopScorersPayload | null },
  { seasonId: number },
  { state: RootState; rejectValue: string }
>("standings/loadBySeason", async ({ seasonId }, thunkApi) => {
  try {
    const state = thunkApi.getState().standings;
    const [tableData, topScorers] = await Promise.all([
      getCompetitionTableFull(state.selectedCompetitionId, { season: seasonId }),
      getTopScorers(state.selectedCompetitionId, { season: seasonId }),
    ]);
    return { selectedSeasonId: seasonId, tableData, topScorers };
  } catch (e) {
    return thunkApi.rejectWithValue(e instanceof Error ? e.message : "Sezon verisi yuklenemedi.");
  }
});

const standingsSlice = createSlice({
  name: "standings",
  initialState,
  reducers: {
    setSidebarTab(state, action: PayloadAction<SidebarTab>) {
      state.sidebarTab = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStandingsInitial.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(loadStandingsInitial.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.initialized = true;
        state.selectedCompetitionId = action.payload.selectedCompetitionId;
        state.seasons = action.payload.seasons;
        state.selectedSeasonId = action.payload.selectedSeasonId;
        state.tableData = action.payload.tableData;
        state.topScorers = action.payload.topScorers;
        state.currentRequestId = null;
      })
      .addCase(loadStandingsInitial.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.initialized = true;
        state.error = action.payload ?? "Puan durumu yuklenemedi.";
        state.currentRequestId = null;
      })
      .addCase(loadStandingsByCompetition.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
        state.selectedCompetitionId = action.meta.arg.competitionId;
      })
      .addCase(loadStandingsByCompetition.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.selectedCompetitionId = action.payload.selectedCompetitionId;
        state.seasons = action.payload.seasons;
        state.selectedSeasonId = action.payload.selectedSeasonId;
        state.tableData = action.payload.tableData;
        state.topScorers = action.payload.topScorers;
        state.currentRequestId = null;
      })
      .addCase(loadStandingsByCompetition.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload ?? "Lig puan durumu yuklenemedi.";
        state.currentRequestId = null;
      })
      .addCase(loadStandingsBySeason.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
        state.selectedSeasonId = action.meta.arg.seasonId;
      })
      .addCase(loadStandingsBySeason.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.selectedSeasonId = action.payload.selectedSeasonId;
        state.tableData = action.payload.tableData;
        state.topScorers = action.payload.topScorers;
        state.currentRequestId = null;
      })
      .addCase(loadStandingsBySeason.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload ?? "Sezon verisi yuklenemedi.";
        state.currentRequestId = null;
      });
  },
});

export const { setSidebarTab } = standingsSlice.actions;
export default standingsSlice.reducer;
