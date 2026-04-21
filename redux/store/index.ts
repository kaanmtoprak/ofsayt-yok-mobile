import authReducer from "@/redux/slices/auth/authSlice";
import leaguesReducer from "@/redux/slices/leagues/leaguesSlice";
import matchesReducer from "@/redux/slices/matches/matchesSlice";
import standingsReducer from "@/redux/slices/standings/standingsSlice";
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leagues: leaguesReducer,
    matches: matchesReducer,
    standings: standingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;