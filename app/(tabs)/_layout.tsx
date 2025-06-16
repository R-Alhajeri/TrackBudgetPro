import React, { useEffect, useMemo, useCallback } from "react";
import { Tabs, useRouter } from "expo-router";
import { Home, PieChart, BarChart3, Settings, User } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import useAppTheme from "../../hooks/useAppTheme";
import useLanguageStore from "../../store/language-store";
import useAuthStore from "../../store/auth-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

export default function TabsLayout() {
  const { colors, isDark } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { userRole } = useAuthStore();
  const router = useRouter();

  // Memoize tab bar style
  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    }),
    [colors.background, colors.border, colors.text]
  );

  // Memoize header style
  const headerStyle = useMemo(
    () => ({
      backgroundColor: colors.background,
    }),
    [colors.background]
  );

  // Notification response handler
  const handleNotificationResponse = useCallback(
    (response: any) => {
      const data = response.notification.request.content.data;

      if (data?.screen) {
        switch (data.screen) {
          case "budget":
            router.push("./categories");
            break;
          case "transactions":
            router.push("./transactions");
            break;
          case "settings":
            router.push("./settings");
            break;
          default:
            console.warn("Unknown notification screen:", data.screen);
        }
      }
    },
    [router]
  );

  useEffect(() => {
    // Only initialize notifications in development builds, not Expo Go
    const isExpoGo = Constants.appOwnership === "expo";

    if (!isExpoGo && Platform.OS !== "web") {
      // Initialize notification manager only in development builds
      let subscription: any;

      try {
        const LocalNotificationManager =
          require("../../utils/LocalNotificationManager").default;
        const Notifications = require("expo-notifications");

        LocalNotificationManager.initialize();

        // Handle notification responses (when user taps on a notification)
        subscription = Notifications.addNotificationResponseReceivedListener(
          handleNotificationResponse
        );
      } catch (error) {
        console.log("Notifications not available in this environment:", error);
      }

      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    } else {
      console.log("Push Notifications require physical device (not Expo Go)");
    }
  }, [handleNotificationResponse]);

  return (
    <>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={colors.background}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.subtext,
          tabBarStyle,
          headerStyle,
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("dashboard"),
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: t("categories"),
            tabBarIcon: ({ color }) => <PieChart size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: t("transactions"),
            tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t("settings"),
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />

        {/* Test screen */}
        <Tabs.Screen
          name="test"
          options={{
            headerTitle: "Test Page",
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
