import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { User, UserPlus } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import useSubscriptionStore from "../store/subscription-store";
import {
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  PressableStates,
} from "../constants/styleGuide";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { colors } = useAppTheme();
  const { t } = useLanguageStore();
  const { setGuestMode } = useSubscriptionStore();
  const router = useRouter();

  const markAsLaunched = async () => {
    await AsyncStorage.setItem("hasLaunchedBefore", "true");
  };

  const handleSignIn = async () => {
    await markAsLaunched();
    router.push("/login");
  };

  const handleGuestMode = async () => {
    await markAsLaunched();
    setGuestMode(true);
    router.replace("/(tabs)" as any);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[styles.logoContainer, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.logoText}>💰</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>
            TrackBudgetPro
          </Text>
          <Text style={[styles.tagline, { color: colors.subtext }]}>
            Your personal finance companion
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              Track Expenses
            </Text>
            <Text
              style={[styles.featureDescription, { color: colors.subtext }]}
            >
              Monitor your spending with detailed categories and insights
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureIcon}>💡</Text>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              Smart Budgeting
            </Text>
            <Text
              style={[styles.featureDescription, { color: colors.subtext }]}
            >
              Set budgets and receive alerts when you're overspending
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureIcon}>📈</Text>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              Financial Insights
            </Text>
            <Text
              style={[styles.featureDescription, { color: colors.subtext }]}
            >
              Analyze your spending patterns with detailed reports
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary },
              pressed && PressableStates.pressed,
            ]}
            onPress={handleSignIn}
          >
            <User size={20} color="white" />
            <Text style={styles.primaryButtonText}>Sign In / Sign Up</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: colors.border },
              pressed && PressableStates.pressed,
            ]}
            onPress={handleGuestMode}
          >
            <UserPlus size={20} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Continue as Guest
            </Text>
          </Pressable>

          <Text style={[styles.disclaimer, { color: colors.subtext }]}>
            Guest mode has limited features. Create a free account for more
            functionality, or upgrade to premium for unlimited access!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing.l,
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.l,
    shadowColor: (Shadows.large as any).shadowColor,
    shadowOffset: (Shadows.large as any).shadowOffset,
    shadowOpacity: (Shadows.large as any).shadowOpacity,
    shadowRadius: (Shadows.large as any).shadowRadius,
    elevation: (Shadows.large as any).elevation,
  },
  logoText: {
    fontSize: 36,
  },
  appName: {
    fontSize: (Typography.largeTitle as any).fontSize,
    fontWeight: "700" as any,
    marginBottom: Spacing.s,
  },
  tagline: {
    fontSize: (Typography.body as any).fontSize,
    fontWeight: (Typography.body as any).fontWeight,
    letterSpacing: (Typography.body as any).letterSpacing,
    textAlign: "center",
  },
  features: {
    marginVertical: Spacing.l,
    gap: Spacing.l,
  },
  featureCard: {
    padding: Spacing.l,
    borderRadius: BorderRadius.large,
    alignItems: "center",
    shadowColor: (Shadows.medium as any).shadowColor,
    shadowOffset: (Shadows.medium as any).shadowOffset,
    shadowOpacity: (Shadows.medium as any).shadowOpacity,
    shadowRadius: (Shadows.medium as any).shadowRadius,
    elevation: (Shadows.medium as any).elevation,
    minHeight: 120,
    justifyContent: "center",
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: Spacing.s,
  },
  featureTitle: {
    fontSize: (Typography.subtitle as any).fontSize,
    fontWeight: "600" as any,
    letterSpacing: (Typography.subtitle as any).letterSpacing,
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: (Typography.caption as any).fontSize,
    fontWeight: (Typography.caption as any).fontWeight,
    letterSpacing: (Typography.caption as any).letterSpacing,
    textAlign: "center",
    lineHeight: 18,
  },
  actions: {
    gap: Spacing.m,
    marginTop: Spacing.xl,
    paddingBottom: Spacing.l,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.medium,
    gap: Spacing.s,
    shadowColor: (Shadows.medium as any).shadowColor,
    shadowOffset: (Shadows.medium as any).shadowOffset,
    shadowOpacity: (Shadows.medium as any).shadowOpacity,
    shadowRadius: (Shadows.medium as any).shadowRadius,
    elevation: (Shadows.medium as any).elevation,
  },
  primaryButtonText: {
    fontSize: (Typography.subtitle as any).fontSize,
    letterSpacing: (Typography.subtitle as any).letterSpacing,
    color: "white",
    fontWeight: "600" as any,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    gap: Spacing.s,
  },
  secondaryButtonText: {
    fontSize: (Typography.subtitle as any).fontSize,
    letterSpacing: (Typography.subtitle as any).letterSpacing,
    fontWeight: "500" as any,
  },
  disclaimer: {
    fontSize: (Typography.caption as any).fontSize,
    fontWeight: (Typography.caption as any).fontWeight,
    letterSpacing: (Typography.caption as any).letterSpacing,
    textAlign: "center",
    marginTop: Spacing.s,
    lineHeight: 16,
  },
});
