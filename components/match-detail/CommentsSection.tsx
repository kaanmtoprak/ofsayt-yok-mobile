import { useAppSelector } from "@/redux/store/hooks";
import { friendlyErrorMessage } from "@/utilities/errorMessage";
import {
  CommentsApiError,
  createMatchComment,
  getMatchComments,
  type MatchComment,
} from "@/services/commentsApi";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

type Props = {
  matchId: string;
};

type LocalComment = MatchComment & {
  pending?: boolean;
};

const MAX_COMMENT_LENGTH = 500;

const relativeTime = (date: string): string => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
};

const avatarLetter = (name: string | null | undefined): string =>
  (name?.trim()?.charAt(0) ?? "?").toUpperCase();

const userDisplayName = (comment: MatchComment): string => comment.user.name ?? "Anonim";

const CommentsSection = ({ matchId }: Props) => {
  const { user } = useAppSelector((state) => state.auth);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const requestRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const isLoggedIn = Boolean(user);
  const remainingChars = MAX_COMMENT_LENGTH - draft.length;

  const loadInitial = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await getMatchComments(matchId);
      if (requestRef.current !== requestId) return;
      setComments(data.items);
      setNextCursor(data.nextCursor);
    } catch (e) {
      if (requestRef.current !== requestId) return;
      setError(
        friendlyErrorMessage(
          e instanceof Error ? e.message : null,
          "Yorumlar şu anda yüklenemiyor. Lütfen tekrar deneyin."
        )
      );
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await getMatchComments(matchId, nextCursor);
      setComments((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const fresh = data.items.filter((item) => !seen.has(item.id));
        return [...prev, ...fresh];
      });
      setNextCursor(data.nextCursor);
    } catch (e) {
      setError(
        friendlyErrorMessage(
          e instanceof Error ? e.message : null,
          "Daha fazla yorum yüklenemedi. Lütfen tekrar deneyin."
        )
      );
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [matchId, nextCursor]);

  const handleSubmit = useCallback(async () => {
    if (!isLoggedIn || sending) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setError(`Yorum en fazla ${MAX_COMMENT_LENGTH} karakter olabilir.`);
      return;
    }

    setError(null);
    setSending(true);
    const optimisticId = `temp-${Date.now()}`;
    const optimisticComment: LocalComment = {
      id: optimisticId,
      body: trimmed,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id ?? "me",
        name: user?.username ?? user?.name ?? null,
        image: user?.image ?? null,
      },
      pending: true,
    };

    setDraft("");
    setComments((prev) => [optimisticComment, ...prev]);

    try {
      const created = await createMatchComment(matchId, trimmed);
      setComments((prev) => prev.map((item) => (item.id === optimisticId ? created : item)));
    } catch (e) {
      setComments((prev) => prev.filter((item) => item.id !== optimisticId));
      if (e instanceof CommentsApiError && e.status === 401) {
        setError("Yorum yapmak için giriş yapmanız gerekiyor.");
        router.push({ pathname: "/(auth)/sign-in", params: { callbackUrl: `/matches/${matchId}` } });
      } else {
        setError(
          friendlyErrorMessage(
            e instanceof Error ? e.message : null,
            "Yorum gönderilemedi. Lütfen tekrar deneyin."
          )
        );
      }
    } finally {
      setSending(false);
    }
  }, [draft, isLoggedIn, matchId, sending, user?.id, user?.image, user?.name, user?.username]);

  const hasComments = comments.length > 0;

  const titleNote = useMemo(() => {
    if (loading) return "Yorumlar yükleniyor...";
    if (!hasComments) return "Henüz yorum yok. İlk yorumu sen yap.";
    return `${comments.length} yorum`;
  }, [comments.length, hasComments, loading]);

  return (
    <View className="rounded-2xl bg-white px-4 py-4 shadow-sm">
      <Text className="text-base font-bold text-neutral-900">Maç Yorumları</Text>
      <Text className="mt-1 text-xs text-neutral-500">{titleNote}</Text>

      {loading ? (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color="#16a34a" />
        </View>
      ) : error && !hasComments ? (
        <View className="mt-4 rounded-xl bg-red-50 px-3 py-3">
          <Text className="text-sm text-red-700">{error}</Text>
          <Pressable onPress={() => void loadInitial()} className="mt-2 self-start rounded-lg bg-red-100 px-3 py-1.5">
            <Text className="text-xs font-semibold text-red-700">Tekrar Dene</Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-3 gap-3">
          {!hasComments ? (
            <View className="rounded-xl bg-neutral-50 px-3 py-3">
              <Text className="text-sm text-neutral-500">Henüz yorum yok. İlk yorumu sen yap.</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} className="rounded-xl border border-neutral-200 px-3 py-3">
                <View className="flex-row items-start">
                  {comment.user.image ? (
                    <Image source={comment.user.image} style={{ width: 34, height: 34, borderRadius: 17 }} />
                  ) : (
                    <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-green-100">
                      <Text className="text-sm font-bold text-green-700">{avatarLetter(comment.user.name)}</Text>
                    </View>
                  )}
                  <View className="ml-2 flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="mr-2 flex-1 text-sm font-semibold text-neutral-900">
                        {userDisplayName(comment)}
                      </Text>
                      <Text className="text-xs text-neutral-500">{relativeTime(comment.createdAt)}</Text>
                    </View>
                    <Text className="mt-1 text-sm leading-5 text-neutral-700">{comment.body}</Text>
                    {comment.pending ? <Text className="mt-1 text-[11px] text-neutral-400">Gönderiliyor...</Text> : null}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {nextCursor && !loading ? (
        <Pressable
          onPress={() => void handleLoadMore()}
          disabled={loadingMore}
          className={`mt-3 rounded-xl border px-4 py-2.5 ${loadingMore ? "border-neutral-200" : "border-neutral-300"}`}
        >
          <Text className="text-center text-sm font-medium text-neutral-700">
            {loadingMore ? "Yükleniyor..." : "Daha fazla yükle"}
          </Text>
        </Pressable>
      ) : null}

      {error && hasComments ? <Text className="mt-2 text-xs text-red-600">{error}</Text> : null}

      <View className="mt-4 border-t border-neutral-200 pt-3">
        {isLoggedIn ? (
          <>
            <TextInput
              multiline
              value={draft}
              onChangeText={setDraft}
              maxLength={MAX_COMMENT_LENGTH}
              className="min-h-[92px] rounded-xl border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900"
              textAlignVertical="top"
              placeholder="Yorumunu yaz..."
              placeholderTextColor="#9ca3af"
              editable={!sending}
            />
            <View className="mt-2 flex-row items-center justify-between">
              <Text className={`text-xs ${remainingChars < 40 ? "text-red-600" : "text-neutral-500"}`}>
                {draft.length}/{MAX_COMMENT_LENGTH}
              </Text>
              <Pressable
                onPress={() => void handleSubmit()}
                disabled={sending || !draft.trim()}
                className={`rounded-xl px-4 py-2.5 ${
                  sending || !draft.trim() ? "bg-green-300" : "bg-green-600"
                }`}
              >
                <Text className="text-sm font-semibold text-white">{sending ? "Gönderiliyor..." : "Gönder"}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View className="rounded-xl bg-neutral-50 px-3 py-3">
            <Text className="text-sm text-neutral-600">Yorum yazmak için giriş yapman gerekiyor.</Text>
            <Pressable
              onPress={() =>
                router.push({ pathname: "/(auth)/sign-in", params: { callbackUrl: `/matches/${matchId}` } })
              }
              className="mt-3 self-start rounded-xl bg-green-600 px-4 py-2.5"
            >
              <Text className="text-sm font-semibold text-white">Giriş Yap</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

export default CommentsSection;
