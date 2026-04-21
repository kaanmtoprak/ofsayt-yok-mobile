import {
    clearAuthError,
    refreshProfile,
    saveProfile,
    signOut,
    updatePassword,
} from "@/redux/slices/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { friendlyErrorMessage } from "@/utilities/errorMessage";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

const Settings = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error, initializing, initialized } = useAppSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setUsername(user.username ?? "");
      setBio(user.bio ?? "");
      setImage(user.image ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (initialized && userId) {
      void dispatch(refreshProfile());
    }
  }, [dispatch, initialized, userId]);

  const profileDirty = useMemo(() => {
    if (!user) return false;
    return (
      (name.trim() || "") !== (user.name ?? "") ||
      (username.trim() || "") !== (user.username ?? "") ||
      (bio.trim() || "") !== (user.bio ?? "") ||
      (image.trim() || "") !== (user.image ?? "")
    );
  }, [bio, image, name, user, username]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileMsg(null);
    dispatch(clearAuthError());
    try {
      await dispatch(
        saveProfile({
          name: name.trim() || null,
          username: username.trim() || null,
          bio: bio.trim() || null,
          image: image.trim() || null,
        })
      ).unwrap();
      setProfileMsg({ type: "ok", text: "Profil güncellendi." });
    } catch (e) {
      setProfileMsg({
        type: "err",
        text: friendlyErrorMessage(
          e instanceof Error ? e.message : null,
          "Profil bilgileri güncellenemedi. Lütfen tekrar deneyin."
        ),
      });
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordMsg(null);
    dispatch(clearAuthError());
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: "err", text: "Tüm şifre alanlarını doldurun." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "err", text: "Yeni şifre en az 6 karakter olmalı." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "err", text: "Yeni şifreler eşleşmiyor." });
      return;
    }

    try {
      await dispatch(updatePassword({ currentPassword, newPassword })).unwrap();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ type: "ok", text: "Şifre güncellendi." });
    } catch (e) {
      setPasswordMsg({
        type: "err",
        text: friendlyErrorMessage(
          e instanceof Error ? e.message : null,
          "Şifre değiştirilemedi. Lütfen tekrar deneyin."
        ),
      });
    }
  };

  if (initializing || !initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F6F7F9]">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-3 text-sm text-neutral-600">Oturum kontrol ediliyor...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-[#F6F7F9] px-4 pt-6">
        <View className="rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-xl font-bold text-neutral-900">Profil</Text>
          <Text className="mt-2 text-sm text-neutral-500">
            Profilini yönetmek için giriş yapman gerekiyor.
          </Text>
          {error ? (
            <Text className="mt-3 text-sm text-red-600">
              {friendlyErrorMessage(error, "Oturum doğrulanamadı. Lütfen tekrar giriş yapın.")}
            </Text>
          ) : null}
          <Pressable
            onPress={() =>
              router.push({ pathname: "/(auth)/sign-in", params: { callbackUrl: "/(tabs)/settings" } })
            }
            className="mt-4 rounded-xl bg-green-600 px-4 py-3"
          >
            <Text className="text-center text-sm font-semibold text-white">Giriş Yap</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({ pathname: "/(auth)/sign-up", params: { callbackUrl: "/(tabs)/settings" } })
            }
            className="mt-3 rounded-xl border border-green-600 px-4 py-3"
          >
            <Text className="text-center text-sm font-semibold text-green-700">Üye Ol</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F6F7F9]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
        <View className="rounded-2xl bg-white p-4 shadow-sm">
          <Text className="text-lg font-bold text-neutral-900">Profil Bilgileri</Text>
          <Text className="mt-1 text-xs text-neutral-500">{user.email}</Text>

          <Text className="mt-4 text-xs text-neutral-600">İsim</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="mt-1 rounded-xl border border-neutral-300 px-3 py-3 text-sm text-neutral-900"
            placeholder="İsim"
            placeholderTextColor="#9ca3af"
            maxLength={80}
          />

          <Text className="mt-3 text-xs text-neutral-600">Kullanıcı adı</Text>
          <TextInput
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            className="mt-1 rounded-xl border border-neutral-300 px-3 py-3 text-sm text-neutral-900"
            placeholder="3-30 karakter, harf/rakam/_"
            placeholderTextColor="#9ca3af"
            maxLength={30}
          />

          <Text className="mt-3 text-xs text-neutral-600">Hakkımda</Text>
          <TextInput
            multiline
            value={bio}
            onChangeText={setBio}
            className="mt-1 min-h-[96px] rounded-xl border border-neutral-300 px-3 py-3 text-sm text-neutral-900"
            placeholder="Kısa bir biyografi..."
            placeholderTextColor="#9ca3af"
            textAlignVertical="top"
            maxLength={2000}
          />

          <Text className="mt-3 text-xs text-neutral-600">Profil görsel URL</Text>
          <TextInput
            autoCapitalize="none"
            value={image}
            onChangeText={setImage}
            className="mt-1 rounded-xl border border-neutral-300 px-3 py-3 text-sm text-neutral-900"
            placeholder="https://..."
            placeholderTextColor="#9ca3af"
          />

          {profileMsg ? (
            <Text className={`mt-3 text-sm ${profileMsg.type === "ok" ? "text-green-700" : "text-red-600"}`}>
              {profileMsg.text}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSaveProfile}
            disabled={loading || !profileDirty}
            className={`mt-4 rounded-xl px-4 py-3 ${
              loading || !profileDirty ? "bg-green-300" : "bg-green-600"
            }`}
          >
            <Text className="text-center text-sm font-semibold text-white">
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </Text>
          </Pressable>
        </View>

        <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="text-lg font-bold text-neutral-900">Şifre Değiştir</Text>

          <Text className="mt-4 text-xs text-neutral-600">Mevcut şifre</Text>
          <TextInput
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            className="mt-1 rounded-xl border border-neutral-300 px-3 py-3 text-sm text-neutral-900"
            placeholder="******"
            placeholderTextColor="#9ca3af"
          />

          <Text className="mt-3 text-xs text-neutral-600">Yeni şifre</Text>
          <TextInput
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            className="mt-1 rounded-xl border border-neutral-300 px-3 py-3 text-sm text-neutral-900"
            placeholder="******"
            placeholderTextColor="#9ca3af"
          />

          <Text className="mt-3 text-xs text-neutral-600">Yeni şifre (tekrar)</Text>
          <TextInput
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            className="mt-1 rounded-xl border border-neutral-300 px-3 py-3 text-sm text-neutral-900"
            placeholder="******"
            placeholderTextColor="#9ca3af"
          />

          {passwordMsg ? (
            <Text className={`mt-3 text-sm ${passwordMsg.type === "ok" ? "text-green-700" : "text-red-600"}`}>
              {passwordMsg.text}
            </Text>
          ) : null}

          <Pressable
            onPress={handleUpdatePassword}
            disabled={loading}
            className={`mt-4 rounded-xl px-4 py-3 ${loading ? "bg-neutral-300" : "bg-neutral-900"}`}
          >
            <Text className="text-center text-sm font-semibold text-white">
              {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => void dispatch(signOut())}
          disabled={loading}
          className={`mt-4 rounded-xl border px-4 py-3 ${
            loading ? "border-red-300" : "border-red-500"
          }`}
        >
          <Text className={`text-center text-sm font-semibold ${loading ? "text-red-300" : "text-red-600"}`}>
            Çıkış Yap
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Settings;