import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type LeaguesState = {
  selectedLeagueId: string | null;
};

const initialState: LeaguesState = {
  selectedLeagueId: null,
};

const leaguesSlice = createSlice({
  name: "leagues",
  initialState,
  reducers: {
    setSelectedLeagueId(state, action: PayloadAction<string | null>) {
      state.selectedLeagueId = action.payload;
    },
  },
});

export const { setSelectedLeagueId } = leaguesSlice.actions;
export default leaguesSlice.reducer;