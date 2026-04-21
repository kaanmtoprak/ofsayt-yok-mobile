import axios from "axios";

const baseURL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const key = (process.env.EXPO_PUBLIC_LIVESCORE_API_KEY ?? "").trim();
const secret = (process.env.EXPO_PUBLIC_LIVESCORE_API_SECRET ?? "").trim();

const buildUrl = (resource: string) => {
  const r = resource.replace(/^\//, "").replace(/\/$/, "");
  const path = r.endsWith(".json") ? r : `${r}.json`;
  return `${baseURL}/${path}`;
};

const authParams = (extra?: Record<string, string | number | boolean | undefined>) => ({
  ...extra,
  key,
  secret,
});

export const get = async <T = unknown>(
  resource: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> => {
  const { data } = await axios.get<T>(buildUrl(resource), {
    params: authParams(params),
    timeout: 20_000,
  });
  return data;
};

export const post = async <T = unknown, B = unknown>(
  resource: string,
  body?: B,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> => {
  const { data } = await axios.post<T>(buildUrl(resource), body, {
    params: authParams(params),
    timeout: 20_000,
  });
  return data;
};
