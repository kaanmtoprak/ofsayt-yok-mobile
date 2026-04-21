export type MatchCommentUser = {
  id: string;
  name: string | null;
  image: string | null;
};

export type MatchComment = {
  id: string;
  body: string;
  createdAt: string;
  user: MatchCommentUser;
};

export type MatchCommentsResponse = {
  items: MatchComment[];
  nextCursor: string | null;
};

type ApiErrorPayload = {
  error?: unknown;
  message?: unknown;
};

export class CommentsApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CommentsApiError";
    this.status = status;
  }
}

const COMMENTS_BASE_URL = (
  process.env.EXPO_PUBLIC_AUTH_BASE_URL ?? "https://ofsayt-yok.vercel.app"
).replace(/\/$/, "");

const buildUrl = (path: string): string => `${COMMENTS_BASE_URL}/${path.replace(/^\//, "")}`;

const readApiError = async (res: Response): Promise<CommentsApiError> => {
  let message = `HTTP ${res.status}`;
  try {
    const json = (await res.json()) as ApiErrorPayload;
    if (typeof json.error === "string" && json.error.trim()) message = json.error;
    else if (typeof json.message === "string" && json.message.trim()) message = json.message;
  } catch {
    // no-op
  }
  return new CommentsApiError(message, res.status);
};

export const getMatchComments = async (
  matchId: string,
  cursor?: string
): Promise<MatchCommentsResponse> => {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  const res = await fetch(
    buildUrl(`/api/matches/${encodeURIComponent(matchId)}/comments${query ? `?${query}` : ""}`),
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    }
  );
  if (!res.ok) throw await readApiError(res);
  const data = (await res.json()) as MatchCommentsResponse;
  return {
    items: Array.isArray(data.items) ? data.items : [],
    nextCursor: data.nextCursor ?? null,
  };
};

export const createMatchComment = async (matchId: string, body: string): Promise<MatchComment> => {
  const res = await fetch(buildUrl(`/api/matches/${encodeURIComponent(matchId)}/comments`), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw await readApiError(res);
  return (await res.json()) as MatchComment;
};

export const deleteMatchComment = async (matchId: string, commentId: string): Promise<void> => {
  const res = await fetch(
    buildUrl(`/api/matches/${encodeURIComponent(matchId)}/comments/${encodeURIComponent(commentId)}`),
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    }
  );
  if (!res.ok) throw await readApiError(res);
};
