import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import {
  CreditCard,
  Crown,
  BarChart3,
  FileSpreadsheet,
  Zap,
  Shield,
  Check,
  ArrowLeft,
} from "lucide-react-native";
import { Stack } from "expo-router";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import useSubscriptionStore from "../store/subscription-store";
import { useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");

export default function SubscriptionScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { isSubscribed, subscriptionExpiry, purchaseSubscription } =
    useSubscriptionStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const features = [
    {
      icon: <Crown size={20} color={colors.primary} />,
      title:
        t("unlimitedCategoriesTransactions") ||
        "Unlimited categories and transactions",
      description:
        t("noLimitsOrganization") || "No limits on your budget organization",
    },
    {
      icon: <BarChart3 size={20} color={colors.primary} />,
      title: t("advancedAnalytics") || "Advanced budget analytics and reports",
      description:
        t("deepSpendingInsights") ||
        "Deep insights into your spending patterns",
    },
    {
      icon: <FileSpreadsheet size={20} color={colors.primary} />,
      title: t("excelExport") || "Excel export with multiple sheets",
      description:
        t("professionalReports") ||
        "Professional reports for detailed analysis",
    },
    {
      icon: <Zap size={20} color={colors.primary} />,
      title: t("removeAds") || "Remove ads and promotional content",
      description: t("cleanExperience") || "Clean, distraction-free experience",
    },
    {
      icon: <Shield size={20} color={colors.primary} />,
      title: t("prioritySupport") || "Priority customer support",
      description: t("getHelpWhenNeeded") || "Get help when you need it most",
    },
  ];

  const handleSubscribe = () => {
    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(async () => {
      try {
        await purchaseSubscription();
      } catch (error) {
        console.error("Subscription error:", error);
      }
      setIsProcessing(false);
      Alert.alert(t("success"), t("subscriptionBenefits"), [
        {
          text: t("done"),
          onPress: () => router.back(),
        },
      ]);
    }, 2000);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("premiumSubscription") || "TrackBudgetPro Premium",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackTitle: "",
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
          ),
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
          },
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View
            style={[styles.heroSection, { backgroundColor: colors.background }]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Crown size={32} color="white" />
              </View>
            </View>

            <Text
              style={[
                styles.appName,
                { color: colors.text, textAlign: isRTL ? "right" : "center" },
              ]}
            >
              TrackBudgetPro
            </Text>
            <Text
              style={[
                styles.premiumLabel,
                {
                  color: colors.primary,
                  textAlign: isRTL ? "right" : "center",
                },
              ]}
            >
              {t("premiumSubscription") || "Premium Subscription"}
            </Text>

            <Text
              style={[
                styles.heroDescription,
                {
                  color: colors.subtext,
                  textAlign: isRTL ? "right" : "center",
                },
              ]}
            >
              {t("unlockFinancialPotential") ||
                "Unlock the full potential of your financial journey"}
            </Text>
          </View>

          {/* Pricing Card */}
          <View style={[styles.pricingCard, { backgroundColor: colors.card }]}>
            <View style={styles.pricingHeader}>
              <Text style={[styles.price, { color: colors.primary }]}>
                $3.99
              </Text>
              <Text style={[styles.period, { color: colors.subtext }]}>
                /month
              </Text>
            </View>
            <Text
              style={[
                styles.pricingSubtext,
                {
                  color: colors.subtext,
                  textAlign: isRTL ? "right" : "center",
                },
              ]}
            >
              {t("cancelAnytimeNoFees") || "Cancel anytime • No hidden fees"}
            </Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text
              style={[
                styles.featuresTitle,
                { color: colors.text, textAlign: isRTL ? "right" : "center" },
              ]}
            >
              {t("whatsIncluded") || "What's included"}
            </Text>

            {features.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: colors.card,
                    flexDirection: isRTL ? "row-reverse" : "row",
                  },
                ]}
              >
                <View
                  style={[
                    styles.featureIconContainer,
                    {
                      backgroundColor: `${colors.primary}10`,
                      marginRight: isRTL ? 0 : 16,
                      marginLeft: isRTL ? 16 : 0,
                    },
                  ]}
                >
                  {feature.icon}
                </View>
                <View style={styles.featureContent}>
                  <Text
                    style={[
                      styles.featureTitle,
                      {
                        color: colors.text,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    style={[
                      styles.featureDescription,
                      {
                        color: colors.subtext,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  >
                    {feature.description}
                  </Text>
                </View>
                <Check size={20} color={colors.success} />
              </View>
            ))}
          </View>

          {/* Action Section */}
          <View style={styles.actionSection}>
            {isSubscribed && subscriptionExpiry ? (
              <View
                style={[
                  styles.activeSubscription,
                  {
                    backgroundColor: `${colors.success}15`,
                    flexDirection: isRTL ? "row-reverse" : "row",
                  },
                ]}
              >
                <Check size={24} color={colors.success} />
                <View
                  style={[
                    styles.subscriptionInfo,
                    {
                      marginLeft: isRTL ? 0 : 12,
                      marginRight: isRTL ? 12 : 0,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.activeTitle,
                      {
                        color: colors.success,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  >
                    {t("premiumActive") || "Premium Active"}
                  </Text>
                  <Text
                    style={[
                      styles.activeSubtitle,
                      {
                        color: colors.text,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  >
                    {t("until") || "Until"}{" "}
                    {new Date(subscriptionExpiry).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <Pressable
                  style={[
                    styles.upgradeButton,
                    { backgroundColor: colors.primary },
                    isProcessing && { opacity: 0.7 },
                  ]}
                  onPress={handleSubscribe}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Crown
                        size={20}
                        color="white"
                        style={{
                          marginRight: isRTL ? 0 : 8,
                          marginLeft: isRTL ? 8 : 0,
                        }}
                      />
                      <Text style={styles.upgradeButtonText}>
                        {t("upgradeToPremium") || "Upgrade to Premium"}
                      </Text>
                    </>
                  )}
                </Pressable>

                <Text
                  style={[
                    styles.demoNote,
                    {
                      color: colors.subtext,
                      textAlign: isRTL ? "right" : "center",
                    },
                  ]}
                >
                  {t("currentlyDemoMode") || "Currently in demo mode"} •{" "}
                  {t("upgradeToUnlock") || "Upgrade to unlock all features"}
                </Text>
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text
              style={[
                styles.footerText,
                {
                  color: colors.subtext,
                  textAlign: isRTL ? "right" : "center",
                },
              ]}
            >
              {Platform.OS === "ios"
                ? t("manageSubscriptionIOS") ||
                  "Manage subscription in App Store"
                : t("manageSubscriptionAndroid") ||
                  "Manage subscription in Play Store"}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  iconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  premiumLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  heroDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  pricingCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pricingHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  price: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
  },
  period: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: 6,
  },
  pricingSubtext: {
    fontSize: 14,
    fontWeight: "500",
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 20,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  activeSubscription: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  subscriptionInfo: {
    marginLeft: 12,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  activeSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  demoNote: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
});
