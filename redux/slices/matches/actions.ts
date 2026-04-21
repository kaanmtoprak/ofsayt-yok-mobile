import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { ApiMatch } from "./matchesSlice";
import { getAllLiveMatches, getAllMatchesByDate, getFixturesByDate } from "./service";

const axiosErrorMessage = (err: unknown): string => {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : "Beklenmeyen hata.";
  }
  const status = err.response?.status;
  const data = err.response?.data;
  let detail = err.message;

  if (data != null && typeof data === "object") {
    const o = data as { error?: unknown; message?: unknown };
    if (o.error != null) detail = String(o.error);
    else if (o.message != null) detail = String(o.message);
  } else if (typeof data === "string" && data.length > 0) {
    detail = data.slice(0, 200);
  } else if (data != null) {
    try {
      detail = JSON.stringify(data).slice(0, 200);
    } catch {
      /* ignore */
    }
  }

  return status != null ? `HTTP ${status}: ${detail}` : detail;
};

export const fetchLiveMatches = createAsyncThunk<
  { historyList: ApiMatch[]; liveList: ApiMatch[]; fixtureList: ApiMatch[] },
  { competition_id?: number; date?: string } | undefined,
  { rejectValue: string }
>("matches/fetchLiveMatches", async (args, thunkApi) => {
  try {
    const selectedDate = args?.date ?? new Date().toISOString().slice(0, 10);
    const competitionId = args?.competition_id;
    const [historyList, liveList, fixtureList] = await Promise.all([
      getAllMatchesByDate(selectedDate, competitionId),
      getAllLiveMatches(competitionId),
      getFixturesByDate(selectedDate, competitionId),
    ]);

    return { historyList, liveList, fixtureList };
  } catch (err) {
    return thunkApi.rejectWithValue(axiosErrorMessage(err));
  }
});

export const refreshLiveFixtures = createAsyncThunk<
  { liveList: ApiMatch[]; fixtureList: ApiMatch[] },
  { competition_id?: number; date?: string } | undefined,
  { rejectValue: string }
>("matches/refreshLiveFixtures", async (args, thunkApi) => {
  try {
    const selectedDate = args?.date ?? new Date().toISOString().slice(0, 10);
    const competitionId = args?.competition_id;
    const [liveList, fixtureList] = await Promise.all([
      getAllLiveMatches(competitionId),
      getFixturesByDate(selectedDate, competitionId),
    ]);
    return { liveList, fixtureList };
  } catch (err) {
    return thunkApi.rejectWithValue(axiosErrorMessage(err));
  }
});