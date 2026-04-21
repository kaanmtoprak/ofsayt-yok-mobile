import {
  changeMyPassword,
  getMyProfile,
  getSession,
  registerUser,
  signInWithCredentials,
  signOutSession,
  updateMyProfile,
} from "@/services/authApi";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  image: string | null;
  role: string | null;
};

type AuthState = {
  user: AuthUser | null;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
};

const initialState: AuthState = {
  user: null,
  initializing: true,
  loading: false,
  error: null,
  initialized: false,
};

const toAuthUser = (raw: Partial<AuthUser> & { id?: string; email?: string }): AuthUser | null => {
  if (!raw.id || !raw.email) return null;
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name ?? null,
    username: raw.username ?? null,
    bio: raw.bio ?? null,
    image: raw.image ?? null,
    role: raw.role ?? null,
  };
};

export const restoreSession = createAsyncThunk<AuthUser | null, void, { rejectValue: string }>(
  "auth/restoreSession",
  async (_, thunkApi) => {
    try {
      const sessionUser = await getSession();
      if (!sessionUser) return null;
      const profile = await getMyProfile();
      return (
        toAuthUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          username: profile.username,
          bio: profile.bio,
          image: profile.image,
          role: profile.role,
        }) ?? null
      );
    } catch (e) {
      return thunkApi.rejectWithValue(e instanceof Error ? e.message : "Oturum yüklenemedi.");
    }
  }
);

export const signIn = createAsyncThunk<
  AuthUser,
  { email: string; password: string },
  { rejectValue: string }
>("auth/signIn", async ({ email, password }, thunkApi) => {
  try {
    const sessionUser = await signInWithCredentials(email, password);
    const profile = await getMyProfile().catch(() => null);
    const user =
      toAuthUser({
        id: profile?.id ?? sessionUser.id,
        email: profile?.email ?? sessionUser.email,
        name: profile?.name ?? sessionUser.name,
        username: profile?.username ?? sessionUser.username,
        bio: profile?.bio ?? null,
        image: profile?.image ?? sessionUser.image,
        role: profile?.role ?? sessionUser.role ?? null,
      }) ?? null;
    if (!user) throw new Error("Kullanıcı bilgisi alınamadı.");
    return user;
  } catch (e) {
    return thunkApi.rejectWithValue(e instanceof Error ? e.message : "Giriş yapılamadı.");
  }
});

export const signUp = createAsyncThunk<
  AuthUser,
  { name?: string; username?: string; email: string; password: string },
  { rejectValue: string }
>("auth/signUp", async (payload, thunkApi) => {
  try {
    const sessionUser = await registerUser(payload);
    const profile = await getMyProfile().catch(() => null);
    const user =
      toAuthUser({
        id: profile?.id ?? sessionUser.id,
        email: profile?.email ?? sessionUser.email,
        name: profile?.name ?? sessionUser.name,
        username: profile?.username ?? sessionUser.username,
        bio: profile?.bio ?? null,
        image: profile?.image ?? sessionUser.image,
        role: profile?.role ?? sessionUser.role ?? null,
      }) ?? null;
    if (!user) throw new Error("Kayıt sonrası kullanıcı bilgisi alınamadı.");
    return user;
  } catch (e) {
    return thunkApi.rejectWithValue(e instanceof Error ? e.message : "Kayıt başarısız.");
  }
});

export const signOut = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/signOut",
  async (_, thunkApi) => {
    try {
      await signOutSession();
    } catch (e) {
      return thunkApi.rejectWithValue(e instanceof Error ? e.message : "Çıkış yapılamadı.");
    }
  }
);

export const refreshProfile = createAsyncThunk<AuthUser, void, { rejectValue: string }>(
  "auth/refreshProfile",
  async (_, thunkApi) => {
    try {
      const profile = await getMyProfile();
      const user =
        toAuthUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          username: profile.username,
          bio: profile.bio,
          image: profile.image,
          role: profile.role,
        }) ?? null;
      if (!user) throw new Error("Profil bilgisi alınamadı.");
      return user;
    } catch (e) {
      return thunkApi.rejectWithValue(e instanceof Error ? e.message : "Profil yüklenemedi.");
    }
  }
);

export const saveProfile = createAsyncThunk<
  AuthUser,
  { name?: string | null; username?: string | null; bio?: string | null; image?: string | null },
  { rejectValue: string }
>("auth/saveProfile", async (payload, thunkApi) => {
  try {
    const profile = await updateMyProfile(payload);
    const user =
      toAuthUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        image: profile.image,
        role: profile.role,
      }) ?? null;
    if (!user) throw new Error("Profil güncelleme başarısız.");
    return user;
  } catch (e) {
    return thunkApi.rejectWithValue(e instanceof Error ? e.message : "Profil güncellenemedi.");
  }
});

export const updatePassword = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string },
  { rejectValue: string }
>("auth/updatePassword", async (payload, thunkApi) => {
  try {
    await changeMyPassword(payload);
  } catch (e) {
    return thunkApi.rejectWithValue(e instanceof Error ? e.message : "Şifre güncellenemedi.");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.initializing = true;
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.initializing = false;
        state.initialized = true;
        state.user = action.payload;
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.initializing = false;
        state.initialized = true;
        state.user = null;
        state.error = action.payload ?? "Oturum yüklenemedi.";
      })
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Giriş yapılamadı.";
      })
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Kayıt başarısız.";
      })
      .addCase(signOut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Çıkış yapılamadı.";
      })
      .addCase(refreshProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(saveProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Profil güncellenemedi.";
      })
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Şifre güncellenemedi.";
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
