import { tabs } from "@/constants/data";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { ImageSourcePropType, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND = "#1BA76F";
const ICON_ACTIVE = "#FFFFFF";
const ICON_INACTIVE = "rgba(255,255,255,0.58)";

const TabIcon = ({
  focused,
  icon,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
}) => {
  return (
    <View className="items-center justify-center">
      <View
        style={[
          styles.iconShell,
          focused ? styles.iconShellActive : styles.iconShellIdle,
        ]}
      >
        <Image
          source={icon}
          style={[
            styles.iconImage,
            { tintColor: focused ? ICON_ACTIVE : ICON_INACTIVE },
          ]}
          contentFit="contain"
        />
      </View>
    </View>
  );
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const barHeight = 56 + bottomPad;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: ICON_ACTIVE,
        tabBarInactiveTintColor: ICON_INACTIVE,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: [
          styles.tabBar,
          {
            height: barHeight,
            paddingBottom: bottomPad,
            paddingTop: 8,
            paddingHorizontal: 4,
          },
        ],
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
            onPress={(e) => {
              if (Platform.OS === "ios") {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              props.onPress?.(e);
            }}
          />
        ),
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={tab.icon} />
            ),
          }}
        />
      ))}
      <Tabs.Screen
        name="news/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="matches/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="teams/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: BRAND,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.22)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabItem: {
    paddingVertical: 2,
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.15,
    marginTop: 2,
    marginBottom: 0,
  },
  iconShell: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 48,
    minHeight: 34,
    borderRadius: 18,
  },
  iconShellActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  iconShellIdle: {
    backgroundColor: "transparent",
  },
  iconImage: {
    width: 24,
    height: 24,
  },
});
