import axios from "axios";

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary?: string;
  content?: string;
  image?: string;
};

type NewsListResponse = {
  success?: boolean;
  items?: NewsItem[];
  error?: string;
};

type NewsDetailResponse = {
  success?: boolean;
  item?: NewsItem;
  error?: string;
};

const newsBaseUrl = (process.env.EXPO_PUBLIC_NEWS_API_BASE_URL ?? "").replace(/\/$/, "");

const buildNewsUrl = (path: string): string => {
  const cleanPath = path.replace(/^\//, "");
  return `${newsBaseUrl}/${cleanPath}`;
};

export const getNews = async (limit = 20): Promise<NewsItem[]> => {
  if (!newsBaseUrl) {
    throw new Error("EXPO_PUBLIC_NEWS_API_BASE_URL tanimli degil.");
  }
  const { data: response } = await axios.get<NewsListResponse>(buildNewsUrl("/api/news"), {
    params: { limit },
    timeout: 20_000,
  });
  if (!response?.success || !Array.isArray(response?.items)) return [];
  return response.items;
};

export const getNewsById = async (id: string): Promise<NewsItem | null> => {
  if (!newsBaseUrl) {
    throw new Error("EXPO_PUBLIC_NEWS_API_BASE_URL tanimli degil.");
  }
  const { data: response } = await axios.get<NewsDetailResponse>(
    buildNewsUrl(`/api/news/${encodeURIComponent(id)}`),
    { timeout: 20_000 }
  );
  if (!response?.success || !response?.item) return null;
  return response.item;
};
