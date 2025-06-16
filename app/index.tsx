import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useSubscriptionStore from "../store/subscription-store";
import useAuthStore from "../store/auth-store";
import useAppTheme from "../hooks/useAppTheme";

export default function Index() {
  const { colors } = useAppTheme();
  const { isGuestMode, isDemoMode } = useSubscriptionStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunchedBefore = await AsyncStorage.getItem(
          "hasLaunchedBefore"
        );

        if (!hasLaunchedBefore && !isAuthenticated && !isGuestMode) {
          // First time launch - show welcome screen
          router.replace("/welcome" as any);
        } else {
          // User has launched before or is authenticated/guest - go to main app
          router.replace("/(tabs)" as any);
        }
      } catch (error) {
        console.error("Error checking first launch:", error);
        // On error, go to main app
        router.replace("/(tabs)" as any);
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstLaunch();
  }, [isAuthenticated, isGuestMode, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return null;
}
