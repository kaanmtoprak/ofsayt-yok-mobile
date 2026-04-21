import { clearAuthError, signUp } from "@/redux/slices/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { Link, router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const SignUp = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const { callbackUrl } = useLocalSearchParams<{ callbackUrl?: string }>();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLocalError(null);
    if (!email.trim() || !password.trim()) {
      setLocalError("E-posta ve şifre zorunlu.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Şifre en az 6 karakter olmalı.");
      return;
    }

    try {
      await dispatch(
        signUp({
          name: name.trim() || undefined,
          username: username.trim() || undefined,
          email: email.trim(),
          password,
        })
      ).unwrap();
      const next = typeof callbackUrl === "string" && callbackUrl.trim() ? callbackUrl : "/(tabs)/settings";
      router.replace(next as never);
    } catch {
      // handled from slice
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F6F7F9]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 16 }}>
        <View className="rounded-2xl bg-white px-4 py-5 shadow-sm">
          <Text className="text-2xl font-bold text-neutral-900">Üye Ol</Text>
          <Text className="mt-1 text-sm text-neutral-500">Yeni hesap oluştur.</Text>

          <View className="mt-4">
            <Text className="mb-1 text-xs text-neutral-600">İsim</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-900"
              placeholder="Ad Soyad"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mt-3">
            <Text className="mb-1 text-xs text-neutral-600">Kullanıcı adı (opsiyonel)</Text>
            <TextInput
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-900"
              placeholder="ornek_kullanici"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mt-3">
            <Text className="mb-1 text-xs text-neutral-600">E-posta</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-900"
              placeholder="ornek@mail.com"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mt-3">
            <Text className="mb-1 text-xs text-neutral-600">Şifre</Text>
            <TextInput
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-900"
              placeholder="******"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {(localError || error) && (
            <Text className="mt-3 text-sm text-red-600">{localError ?? error}</Text>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`mt-4 rounded-xl px-4 py-3 ${loading ? "bg-green-300" : "bg-green-600"}`}
          >
            <Text className="text-center text-sm font-semibold text-white">
              {loading ? "Kayıt yapılıyor..." : "Üye Ol"}
            </Text>
          </Pressable>

          <View className="mt-4 flex-row items-center justify-center">
            <Text className="text-sm text-neutral-500">Zaten hesabın var mı? </Text>
            <Link
              href={{ pathname: "/(auth)/sign-in", params: { callbackUrl: callbackUrl ?? "/(tabs)/settings" } }}
              className="text-sm font-semibold text-green-700"
              onPress={() => {
                dispatch(clearAuthError());
              }}
            >
              Giriş Yap
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;