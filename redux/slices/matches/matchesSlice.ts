import { createSlice } from "@reduxjs/toolkit";
import { fetchLiveMatches, refreshLiveFixtures } from "./actions";

export type ApiTeam = {
  id: number;
  name: string;
  logo: string;
};

export type ApiCountry = {
  id: number;
  name: string;
  fifa_code: string;
  flag: string;
} | null;

export type ApiCompetition = {
  id: number;
  name: string;
  logo?: string;
};

export type ApiScores = {
  score: string;
  ht_score: string;
  ft_score: string;
};

export type ApiMatch = {
  id: number;
  date?: string;
  time?: string;
  scheduled?: string;
  status?: string;
  home?: ApiTeam;
  away?: ApiTeam;
  competition?: ApiCompetition;
  country?: ApiCountry | string;
  scores?: ApiScores;
  home_name?: string;
  away_name?: string;
  score?: string;
  ht_score?: string;
  competition_name?: string;
  league_name?: string;
  location?: string;
  referee?: string;
  fixture_id?: number;
  group_id?: number;
  group_name?: string;
};



type MatchesState = {
  historyList: ApiMatch[];
  liveList: ApiMatch[];
  fixtureList: ApiMatch[];
  loading: boolean;
  error: string | null;
};

const initialState: MatchesState = {
  historyList: [],
  liveList: [],
  fixtureList: [],
  loading: false,
  error: null,
};



const matchesSlice = createSlice({
  name: "matches",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLiveMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.historyList = [];
        state.liveList = [];
        state.fixtureList = [];
      })
      .addCase(fetchLiveMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.historyList = action.payload.historyList;
        state.liveList = action.payload.liveList;
        state.fixtureList = action.payload.fixtureList;
      })
      .addCase(fetchLiveMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Maçlar alınamadı.";
      })
      .addCase(refreshLiveFixtures.fulfilled, (state, action) => {
        state.liveList = action.payload.liveList;
        state.fixtureList = action.payload.fixtureList;
      })
      .addCase(refreshLiveFixtures.rejected, (state, action) => {
        state.error = action.payload ?? "Canli veriler guncellenemedi.";
      });
  },
});

export default matchesSlice.reducer;
