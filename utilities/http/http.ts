import axios from "axios";

const baseURL = (
  process.env.EXPO_PUBLIC_NEWS_API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  ""
).replace(/\/$/, "");
const buildUrl = (resource: string) => `${baseURL}/${resource.replace(/^\//, "")}`;

export const get = async <T = unknown>(
  resource: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> => {
  const { data } = await axios.get<T>(buildUrl(resource), {
    params,
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
    params,
    timeout: 20_000,
  });
  return data;
};
