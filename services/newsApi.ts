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
  success: boolean;
  items?: NewsItem[];
  error?: string;
};

type NewsDetailResponse = {
  success: boolean;
  item?: NewsItem;
  error?: string;
};

const NEWS_DEFAULT_BASE_URL = "https://ofsayt-yok.vercel.app";

const newsBaseUrl = (
  process.env.EXPO_PUBLIC_NEWS_API_BASE_URL ??
  NEWS_DEFAULT_BASE_URL
).replace(/\/$/, "");

const buildNewsUrl = (path: string): string => {
  const cleanPath = path.replace(/^\//, "");
  return `${newsBaseUrl}/${cleanPath}`;
};

const toUserError = (e: unknown): string => {
  if (!axios.isAxiosError(e)) return e instanceof Error ? e.message : "Bilinmeyen hata.";
  if (e.code === "ECONNABORTED") return "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.";
  const status = e.response?.status;
  if (status === 404) return "Haber servisi bulunamadı.";
  if (status === 500) return "Sunucu hatası oluştu.";
  if (status != null) return `Haber servisi hatası (HTTP ${status}).`;
  return "Ağ bağlantısı kurulamadı.";
};

export const getNews = async (limit = 15): Promise<NewsItem[]> => {
  try {
    const { data: response } = await axios.get<NewsListResponse>(buildNewsUrl("/api/news"), {
      params: { limit },
      timeout: 20_000,
    });
    if (!response.success || !Array.isArray(response.items)) return [];
    return response.items;
  } catch (e) {
    throw new Error(toUserError(e));
  }
};

export const getNewsById = async (id: string): Promise<NewsItem | null> => {
  try {
    const { data: response } = await axios.get<NewsDetailResponse>(
      buildNewsUrl(`/api/news/${encodeURIComponent(id)}`),
      { timeout: 20_000 }
    );
    if (!response.success || !response.item) return null;
    return response.item;
  } catch (e) {
    throw new Error(toUserError(e));
  }
};
