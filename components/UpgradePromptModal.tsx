import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import {
  Crown,
  X,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Clock,
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
import { useABTesting } from "../hooks/useABTesting";
import { useProgressiveRestrictions } from "../hooks/useProgressiveRestrictions";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface UpgradePromptModalProps {
  visible: boolean;
  onClose: () => void;
  trigger:
    | "category_limit"
    | "transaction_limit"
    | "export_attempt"
    | "analytics_attempt"
    | "time_based";
  urgencyLevel?: "low" | "medium" | "high";
}

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  visible,
  onClose,
  trigger,
  urgencyLevel = "medium",
}) => {
  const { colors } = useAppTheme();
  const { isGuestMode, isDemoMode } = useSubscriptionStore();
  const { getCurrentRestrictions, checkRestriction } =
    useProgressiveRestrictions();
  const router = useRouter();
  const { getUpgradePromptConfig, trackConversion, trackInteraction } =
    useABTesting();
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));

  // Get A/B test configuration
  const abConfig = getUpgradePromptConfig();
  const restrictions = getCurrentRestrictions();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getPromptContent = () => {
    // Apply A/B test configuration
    const baseContent = getBaseContent();

    // Modify content based on A/B test variant
    if (abConfig.variant === "urgent") {
      baseContent.title = `🚨 ${baseContent.title}`;
      baseContent.urgencyText = `⏰ ${baseContent.urgencyText}`;
      baseContent.ctaText = `${baseContent.ctaText} Now!`;
    } else if (abConfig.variant === "social_proof") {
      baseContent.benefits.push("Join 50,000+ satisfied users");
      baseContent.urgencyText = `⭐ Rated 4.8/5 by users like you`;
    } else if (abConfig.variant === "value_focused") {
      baseContent.title = `💰 ${baseContent.title} - Save Money`;
      baseContent.benefits = baseContent.benefits.map((b) => `💎 ${b}`);
    }

    return baseContent;
  };

  const getBaseContent = () => {
    const categoryCheck = checkRestriction("categoryLimit");
    const transactionCheck = checkRestriction("transactionLimit");

    switch (trigger) {
      case "category_limit":
        return {
          title: "Unlock More Categories",
          subtitle:
            categoryCheck.reason || "You've reached your category limit",
          benefits: [
            categoryCheck.upgradePrompt || "Get more categories",
            "Advanced spending analytics",
            "Custom category icons & colors",
            "Export detailed reports",
          ],
          ctaText:
            isGuestMode || isDemoMode
              ? "Create Free Account"
              : "Upgrade to Premium",
          urgencyText: "Join 50,000+ users managing their finances better",
        };
      case "transaction_limit":
        return {
          title: "Track More Transactions",
          subtitle:
            transactionCheck.reason || "You've reached your transaction limit",
          benefits: [
            transactionCheck.upgradePrompt || "Get more transactions",
            "Detailed spending insights",
            "Monthly & yearly reports",
            "Advanced filtering & search",
          ],
          ctaText:
            isGuestMode || isDemoMode
              ? "Create Free Account"
              : "Upgrade to Premium",
          urgencyText: "Don't let limits stop your financial progress",
        };
      case "export_attempt":
        return {
          title: "Professional Reports Await",
          subtitle: "Export feature requires premium",
          benefits: [
            "Excel export with multiple sheets",
            "PDF reports with charts",
            "Customizable date ranges",
            "Share reports easily",
          ],
          ctaText: "Unlock Export Features",
          urgencyText: "Perfect for tax season & financial planning",
        };
      case "analytics_attempt":
        return {
          title: "Deep Financial Insights",
          subtitle: "Advanced analytics available in premium",
          benefits: [
            "Spending trend analysis",
            "Category-wise breakdowns",
            "Monthly comparison charts",
            "Budget vs actual reports",
          ],
          ctaText: "Access Analytics Now",
          urgencyText: "Make smarter financial decisions",
        };
      case "time_based":
        return {
          title: "Ready to Take Control?",
          subtitle: "You've been exploring for a while",
          benefits: [
            "Everything you've seen + more",
            "No ads, no interruptions",
            "Priority customer support",
            "Advanced budget tools",
          ],
          ctaText: isGuestMode ? "Create Your Account" : "Go Premium Today",
          urgencyText: "Limited time: First month only $1.99",
        };
      default:
        return {
          title: "Upgrade to Premium",
          subtitle: "Unlock all features",
          benefits: [
            "Unlimited categories & transactions",
            "Advanced analytics & insights",
            "Export & backup features",
            "Priority support",
          ],
          ctaText: "Get Premium",
          urgencyText: "Transform your financial management",
        };
    }
  };

  const handleUpgrade = () => {
    // Track A/B test conversion
    trackConversion("upgrade_prompt", trigger);
    trackEvent("upgrade_prompt_clicked", {
      trigger,
      urgencyLevel,
      abTestVariant: abConfig.variant,
      isGuestMode,
      isDemoMode,
    });

    onClose();
    if (isGuestMode) {
      router.push("/signup" as any);
    } else {
      router.push("../subscription");
    }
  };

  const handleMaybeLater = () => {
    // Track A/B test interaction
    trackInteraction("upgrade_prompt", "dismissed", trigger);
    trackEvent("upgrade_prompt_dismissed", {
      trigger,
      urgencyLevel,
      abTestVariant: abConfig.variant,
      isGuestMode,
      isDemoMode,
    });

    onClose();
  };

  const content = getPromptContent();
  const urgencyColor =
    urgencyLevel === "high"
      ? "#e74c3c"
      : urgencyLevel === "medium"
      ? "#f39c12"
      : colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: colors.background },
            {
              transform: [
                { scale: scaleAnim },
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenHeight, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Crown size={32} color={colors.primary} />
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>
              {content.title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              {content.subtitle}
            </Text>

            {/* Benefits List */}
            <View style={styles.benefitsList}>
              {content.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View
                    style={[
                      styles.checkIcon,
                      { backgroundColor: `${colors.primary}20` },
                    ]}
                  >
                    <Star size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            {/* Urgency Message */}
            <View
              style={[
                styles.urgencyContainer,
                { backgroundColor: `${urgencyColor}10` },
              ]}
            >
              <TrendingUp size={16} color={urgencyColor} />
              <Text style={[styles.urgencyText, { color: urgencyColor }]}>
                {content.urgencyText}
              </Text>
            </View>

            {/* Social Proof */}
            <View style={styles.socialProofContainer}>
              <Users size={16} color={colors.subtext} />
              <Text style={[styles.socialProofText, { color: colors.subtext }]}>
                Trusted by 50,000+ users worldwide
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleUpgrade}
            >
              <Text style={styles.primaryButtonText}>{content.ctaText}</Text>
              <Crown size={18} color="white" style={{ marginLeft: 8 }} />
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={handleMaybeLater}
            >
              <Text
                style={[styles.secondaryButtonText, { color: colors.subtext }]}
              >
                Maybe Later
              </Text>
            </Pressable>
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustIndicators}>
            <View style={styles.trustItem}>
              <Shield size={14} color={colors.subtext} />
              <Text style={[styles.trustText, { color: colors.subtext }]}>
                Secure Payment
              </Text>
            </View>
            <View style={styles.trustItem}>
              <Clock size={14} color={colors.subtext} />
              <Text style={[styles.trustText, { color: colors.subtext }]}>
                Cancel Anytime
              </Text>
            </View>
            <View style={styles.trustItem}>
              <Zap size={14} color={colors.subtext} />
              <Text style={[styles.trustText, { color: colors.subtext }]}>
                Instant Access
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.large,
    padding: 24,
    maxHeight: screenHeight * 0.85,
    ...Shadows.large,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "left",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  benefitText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  urgencyContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: BorderRadius.medium,
    marginBottom: 16,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  socialProofContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  socialProofText: {
    fontSize: 13,
    marginLeft: 6,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: BorderRadius.medium,
    ...Shadows.medium,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    padding: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  trustIndicators: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  trustText: {
    fontSize: 12,
    marginLeft: 4,
  },
});
