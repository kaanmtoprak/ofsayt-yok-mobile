import logo from "@/assets/images/logo.png";
import { clearAuthError, signOut } from "@/redux/slices/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Header = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { user, loading, initializing } = useAppSelector((state) => state.auth);

  const displayName = user?.username ?? user?.name ?? user?.email ?? "";

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: "#1BA76F" }}>
      <View className="h-14 px-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.push("/")}>
          <Image source={logo} style={{ width: 130, height: 28 }} contentFit="contain" />
        </Pressable>

        {initializing || loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : !user ? (
          <Pressable
            onPress={() => {
              dispatch(clearAuthError());
              router.push({ pathname: "/(auth)/sign-in", params: { callbackUrl: "/(tabs)/settings" } });
            }}
            className="rounded-full border border-white/70 px-3 py-1.5"
          >
            <Text className="text-xs font-semibold text-white">Giriş Yap</Text>
          </Pressable>
        ) : (
          <View className="max-w-[180px] flex-row items-center gap-2">
            <Text numberOfLines={1} className="flex-1 text-right text-xs font-semibold text-white">
              {displayName}
            </Text>
            <Pressable
              onPress={() => {
                void dispatch(signOut());
              }}
              className="rounded-full border border-white/70 px-2.5 py-1"
            >
              <Text className="text-[11px] font-semibold text-white">Çıkış Yap</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

export default Header;