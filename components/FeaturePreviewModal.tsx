import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  BarChart,
  TrendingUp,
  Download,
  Smartphone,
  Users,
  Shield,
  Star,
  Crown,
  Calendar,
  Bell,
  X,
} from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";
import useSubscriptionStore from "../store/subscription-store";
import { useRouter } from "expo-router";
import {
  BorderRadius,
  Typography,
  Shadows,
  Spacing,
} from "../constants/styleGuide";
import { trackEvent } from "../utils/analytics";

const { width: screenWidth } = Dimensions.get("window");

interface FeaturePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  trigger?: string;
}

export const FeaturePreviewModal: React.FC<FeaturePreviewModalProps> = ({
  visible,
  onClose,
  trigger = "manual",
}) => {
  const { colors } = useAppTheme();
  const { isGuestMode } = useSubscriptionStore();
  const router = useRouter();

  const [slideAnim] = useState(new Animated.Value(screenWidth));
  const [currentFeature, setCurrentFeature] = useState(0);

  const premiumFeatures = [
    {
      icon: <BarChart size={32} color={colors.primary} />,
      title: "Advanced Analytics",
      description:
        "Get detailed insights into your spending patterns with interactive charts and trend analysis.",
      benefits: [
        "Monthly/yearly spending trends",
        "Category breakdown charts",
        "Budget vs actual comparisons",
        "Spending forecasts",
      ],
      preview: "📊 See how you spent $2,847 this month across 8 categories",
    },
    {
      icon: <Download size={32} color={colors.primary} />,
      title: "Export & Backup",
      description:
        "Export your data in multiple formats and keep secure backups of all your financial information.",
      benefits: [
        "CSV/PDF export",
        "Automatic cloud backup",
        "Data recovery options",
        "Multi-device sync",
      ],
      preview: "💾 Download your 156 transactions as CSV or PDF reports",
    },
    {
      icon: <Smartphone size={32} color={colors.primary} />,
      title: "Multi-Device Sync",
      description:
        "Access your budget from anywhere with real-time synchronization across all your devices.",
      benefits: [
        "Real-time sync",
        "Offline access",
        "Cross-platform support",
        "Family sharing",
      ],
      preview:
        "📱 Your data automatically syncs between phone, tablet, and web",
    },
    {
      icon: <Bell size={32} color={colors.primary} />,
      title: "Smart Notifications",
      description:
        "Stay on track with intelligent alerts about your spending and budget goals.",
      benefits: [
        "Budget limit alerts",
        "Unusual spending warnings",
        "Monthly summaries",
        "Goal reminders",
      ],
      preview: '🔔 "You\'ve spent 80% of your dining budget this month"',
    },
    {
      icon: <Calendar size={32} color={colors.primary} />,
      title: "Unlimited History",
      description:
        "Track your financial journey with unlimited transaction history and detailed records.",
      benefits: [
        "Unlimited transactions",
        "Historical comparisons",
        "Year-over-year analysis",
        "Long-term trends",
      ],
      preview: "📅 View your complete financial history from day one",
    },
    {
      icon: <Shield size={32} color={colors.primary} />,
      title: "Premium Support",
      description:
        "Get priority customer support and access to exclusive features and updates.",
      benefits: [
        "Priority email support",
        "Live chat assistance",
        "Feature requests",
        "Beta access",
      ],
      preview: "🛡️ Get help within 24 hours from our premium support team",
    },
  ];

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Track feature preview view
      trackEvent("feature_preview_opened", {
        trigger,
        featureCount: premiumFeatures.length,
        userType: isGuestMode ? "guest" : "demo",
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleFeatureSelect = (index: number) => {
    setCurrentFeature(index);

    trackEvent("feature_preview_interaction", {
      featureIndex: index,
      featureTitle: premiumFeatures[index].title,
      trigger,
    });
  };

  const handleUpgrade = () => {
    trackEvent("feature_preview_upgrade_click", {
      currentFeature: premiumFeatures[currentFeature].title,
      trigger,
      timeSpent: Date.now(), // Could track actual time spent viewing
    });

    onClose();

    if (isGuestMode) {
      router.push("/signup" as any);
    } else {
      router.push("/subscription" as any);
    }
  };

  const handleClose = () => {
    trackEvent("feature_preview_closed", {
      currentFeature: premiumFeatures[currentFeature].title,
      trigger,
      completed: false,
    });
    onClose();
  };

  if (!visible) return null;

  const feature = premiumFeatures[currentFeature];

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.background,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitle}>
              <Crown size={24} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>
                Premium Features
              </Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Feature Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabContainer}
          >
            {premiumFeatures.map((feat, index) => (
              <Pressable
                key={index}
                style={[
                  styles.tab,
                  {
                    backgroundColor:
                      currentFeature === index ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleFeatureSelect(index)}
              >
                <View style={styles.tabIcon}>
                  {React.cloneElement(feat.icon, {
                    size: 20,
                    color: currentFeature === index ? "white" : colors.primary,
                  })}
                </View>
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: currentFeature === index ? "white" : colors.text,
                      fontSize: 12,
                    },
                  ]}
                >
                  {feat.title.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Feature Content */}
          <ScrollView style={styles.content}>
            <View style={styles.featureHeader}>
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: `${colors.primary}20` },
                ]}
              >
                {feature.icon}
              </View>
              <View style={styles.featureTitle}>
                <Text style={[styles.featureTitleText, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text
                  style={[styles.featureDescription, { color: colors.subtext }]}
                >
                  {feature.description}
                </Text>
              </View>
            </View>

            {/* Preview */}
            <View
              style={[
                styles.previewBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.previewLabel, { color: colors.primary }]}>
                ✨ Preview
              </Text>
              <Text style={[styles.previewText, { color: colors.text }]}>
                {feature.preview}
              </Text>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                What you'll get:
              </Text>
              {feature.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Star
                    size={16}
                    color={colors.primary}
                    fill={colors.primary}
                  />
                  <Text style={[styles.benefitText, { color: colors.subtext }]}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            {/* Social Proof */}
            <View
              style={[styles.socialProof, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.socialProofText, { color: colors.text }]}>
                Join over 50,000+ users who upgraded to premium
              </Text>
              <View style={styles.rating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} color="#FFD700" fill="#FFD700" />
                ))}
                <Text style={[styles.ratingText, { color: colors.subtext }]}>
                  4.8/5 App Store
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              style={[
                styles.upgradeButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleUpgrade}
            >
              <Crown size={20} color="white" />
              <Text style={styles.upgradeButtonText}>
                {isGuestMode ? "Sign Up Free" : "Upgrade Now"}
              </Text>
            </Pressable>
            <Text style={[styles.footerText, { color: colors.subtext }]}>
              {isGuestMode
                ? "No credit card required"
                : "30-day money-back guarantee"}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: screenWidth * 0.9,
    maxHeight: "80%",
    borderRadius: BorderRadius.large,
    ...Shadows.large,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.l,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: Spacing.s,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  tabContainer: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  tab: {
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    marginRight: Spacing.s,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    minWidth: 60,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabText: {
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: Spacing.l,
  },
  featureHeader: {
    flexDirection: "row",
    marginBottom: Spacing.l,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.m,
  },
  featureTitle: {
    flex: 1,
  },
  featureTitleText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewBox: {
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    marginBottom: Spacing.l,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  previewText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  benefitsContainer: {
    marginBottom: Spacing.l,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.m,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  benefitText: {
    marginLeft: Spacing.s,
    fontSize: 14,
  },
  socialProof: {
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  socialProofText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.s,
    textAlign: "center",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: Spacing.s,
    fontSize: 12,
  },
  footer: {
    padding: Spacing.l,
    borderTopWidth: 1,
    alignItems: "center",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.s,
    minWidth: 200,
    ...Shadows.medium,
  },
  upgradeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: Spacing.s,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});
