
import logo from "@/assets/images/logo.png";
import React from 'react';
import { Image, SafeAreaView, View } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Header = () => {
    const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={{ backgroundColor: "#1BA76F" }}>
      <View className="h-14 px-4 flex-row items-center justify-center bg-green">
        <Image source={logo} className="w-100" resizeMode="contain" />
      </View>
     </SafeAreaView>
  )
}

export default Header   