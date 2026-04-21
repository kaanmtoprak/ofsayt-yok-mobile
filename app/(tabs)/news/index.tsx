import { getNews, type NewsItem } from "@/services/newsApi";
import { friendlyErrorMessage } from "@/utilities/errorMessage";
import { timeAgo } from "@/utilities/timeAgo";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";

const News = () => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async (opts?: { refreshing?: boolean; silent?: boolean }) => {
    const requestId = ++requestIdRef.current;
    if (opts?.refreshing) setRefreshing(true);
    else if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const data = await getNews(15);
      if (requestId !== requestIdRef.current) return;
      setItems(data);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(
        friendlyErrorMessage(
          e instanceof Error ? e.message : null,
          "Haberler şu anda yüklenemiyor. Lütfen tekrar deneyin."
        )
      );
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-3 text-neutral-500">Haberler yükleniyor...</Text>
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

  if (!items.length) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-neutral-500">Şu an güncel haber bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ refreshing: true })} />}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/news/[id]", params: { id: item.id } })}
            className="mx-3 mb-3 overflow-hidden rounded-xl border border-neutral-200 bg-white"
          >
            {item.image ? <Image source={{ uri: item.image }} style={{ width: "100%", height: 170 }} contentFit="cover" /> : null}
            <View className="p-3">
              <Text className="text-[16px] font-semibold text-neutral-900">{item.title}</Text>
              <View className="mt-2 flex-row items-center">
                <Text className="text-xs font-medium text-neutral-600">{item.source || "Kaynak"}</Text>
                <Text className="mx-1 text-xs text-neutral-400">·</Text>
                <Text className="text-xs text-neutral-500">{timeAgo(item.publishedAt)}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
};

export default News;
