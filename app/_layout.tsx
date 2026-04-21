import { Header } from "@/components";
import "@/global.css";
import { restoreSession } from "@/redux/slices/auth/authSlice";
import { store } from "@/redux/store";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useDispatch } from "react-redux";

const AppShell = () => {
  const dispatch = useDispatch<typeof store.dispatch>();
  useEffect(() => {
    void dispatch(restoreSession());
  }, [dispatch]);
  return (
    <View className="flex-1 bg-white">
      <Header />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
};

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppShell />
      </GestureHandlerRootView>
    </Provider>
  );
}