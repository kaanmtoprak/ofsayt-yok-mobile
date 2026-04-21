type SessionUser = {
  id?: string;
  email?: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
  bio?: string | null;
  role?: string;
};

type SessionResponse = {
  user?: SessionUser;
  expires?: string;
};

type CsrfResponse = {
  csrfToken?: string;
};

type RegisterResponse = {
  user?: SessionUser;
  error?: string;
};

type ProfileResponse = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  image: string | null;
  role: string;
};

const AUTH_BASE_URL = (
  process.env.EXPO_PUBLIC_AUTH_BASE_URL ??
  "https://ofsayt-yok.vercel.app"
).replace(/\/$/, "");

const buildUrl = (path: string): string => `${AUTH_BASE_URL}/${path.replace(/^\//, "")}`;

const toFormUrlEncoded = (payload: Record<string, string>): string =>
  Object.entries(payload)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

const readErrorMessage = async (res: Response): Promise<string> => {
  try {
    const json = (await res.json()) as { error?: unknown; message?: unknown };
    if (typeof json.error === "string" && json.error.trim()) return json.error;
    if (typeof json.message === "string" && json.message.trim()) return json.message;
  } catch {
    // ignore
  }
  return `HTTP ${res.status}`;
};

const getCsrfToken = async (): Promise<string> => {
  const res = await fetch(buildUrl("/api/auth/csrf"), {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const json = (await res.json()) as CsrfResponse;
  if (!json.csrfToken) throw new Error("CSRF token alınamadı.");
  return json.csrfToken;
};

export const getSession = async (): Promise<SessionUser | null> => {
  const res = await fetch(buildUrl("/api/auth/session"), {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const json = (await res.json()) as SessionResponse;
  return json.user ?? null;
};

export const signInWithCredentials = async (email: string, password: string): Promise<SessionUser> => {
  const csrfToken = await getCsrfToken();
  const formBody = toFormUrlEncoded({
    csrfToken,
    email,
    password,
    redirect: "false",
    callbackUrl: "/",
    json: "true",
  });

  const res = await fetch(buildUrl("/api/auth/callback/credentials"), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    credentials: "include",
    body: formBody,
  });

  if (!res.ok) {
    throw new Error("E-posta veya şifre hatalı.");
  }

  const sessionUser = await getSession();
  if (!sessionUser) throw new Error("Giriş başarılı fakat oturum alınamadı.");
  return sessionUser;
};

export const signOutSession = async (): Promise<void> => {
  const csrfToken = await getCsrfToken();
  const formBody = toFormUrlEncoded({
    csrfToken,
    redirect: "false",
    callbackUrl: "/",
    json: "true",
  });
  const res = await fetch(buildUrl("/api/auth/signout"), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    credentials: "include",
    body: formBody,
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
};

export const registerUser = async (payload: {
  name?: string;
  username?: string;
  email: string;
  password: string;
}): Promise<SessionUser> => {
  const res = await fetch(buildUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const json = (await res.json()) as RegisterResponse;
  if (json.error) throw new Error(json.error);
  return await signInWithCredentials(payload.email, payload.password);
};

export const getMyProfile = async (): Promise<ProfileResponse> => {
  const res = await fetch(buildUrl("/api/user/me"), {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as ProfileResponse;
};

export const updateMyProfile = async (payload: {
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  image?: string | null;
}): Promise<ProfileResponse> => {
  const res = await fetch(buildUrl("/api/user/me"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as ProfileResponse;
};

export const changeMyPassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  const res = await fetch(buildUrl("/api/user/password"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
};
