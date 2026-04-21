import { Header } from "@/components";
import "@/global.css";
import { store } from "@/redux/store";
import { Stack } from "expo-router";
import { View } from "react-native";
import { Provider } from "react-redux";

export default function RootLayout() {  
  return (
    <Provider store={store}>
      <View className="flex-1 bg-white">
        <Header />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </Provider>
  );
}