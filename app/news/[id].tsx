import { getNews, getNewsById, type NewsItem } from "@/services/newsApi";
import { timeAgo } from "@/utilities/timeAgo";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NewsDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [sidebarNews, setSidebarNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") {
      setArticle(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getNewsById(id), getNews(6)])
      .then(([item, allNews]) => {
        if (cancelled) return;
        setArticle(item);
        setSidebarNews(allNews.filter((n) => n.id !== id).slice(0, 5));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Haber yüklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const bodyText = useMemo(() => {
    return (article?.content || article?.summary || "").trim();
  }, [article]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-3 text-neutral-500">Yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-neutral-500">{error}</Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-lg font-semibold text-neutral-900">Haber bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-neutral-900">{article.title}</Text>
        <View className="mt-2 flex-row items-center">
          <Text className="text-sm font-medium text-neutral-700">{article.source || "Kaynak"}</Text>
          <Text className="mx-1 text-sm text-neutral-400">·</Text>
          <Text className="text-sm text-neutral-500">{formatDate(article.publishedAt)}</Text>
        </View>
      </View>

      {article.image ? (
        <View className="mt-4 px-4">
          <Image source={{ uri: article.image }} style={{ width: "100%", height: 220, borderRadius: 12 }} contentFit="cover" />
        </View>
      ) : null}

      <View className="px-4 pt-4">
        {bodyText ? (
          bodyText.split("\n").map((p, i) => {
            const t = p.trim();
            if (!t) return null;
            return (
              <Text key={`${i}_${t.slice(0, 8)}`} className="mb-3 text-[16px] leading-6 text-neutral-800">
                {t}
              </Text>
            );
          })
        ) : (
          <Text className="text-neutral-600">İçerik bulunamadı.</Text>
        )}
      </View>

      {article.url ? (
        <View className="px-4 pt-2">
          <Pressable
            onPress={() => Linking.openURL(article.url)}
            className="rounded-lg border border-green-600 bg-green-50 px-3 py-2"
          >
            <Text className="text-center font-semibold text-green-700">Haberin kaynağını oku →</Text>
          </Pressable>
        </View>
      ) : null}

      <View className="mt-6 px-4">
        <Text className="mb-3 text-lg font-bold text-neutral-900">Diğer Haberler</Text>
        {!sidebarNews.length ? (
          <Text className="text-neutral-500">Şu an güncel haber bulunamadı.</Text>
        ) : (
          sidebarNews.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push({ pathname: "/news/[id]", params: { id: item.id } })}
              className="mb-3 rounded-lg border border-neutral-200 bg-white p-3"
            >
              <Text className="text-sm font-semibold text-neutral-900">{item.title}</Text>
              <View className="mt-1 flex-row items-center">
                <Text className="text-xs text-neutral-600">{item.source || "Kaynak"}</Text>
                <Text className="mx-1 text-xs text-neutral-400">·</Text>
                <Text className="text-xs text-neutral-500">{timeAgo(item.publishedAt)}</Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default NewsDetails;