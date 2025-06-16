import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Crown, TrendingUp, Users, Clock, Star } from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import useSubscriptionStore from "../store/subscription-store";
import useBudgetStore from "../store/budget-store";
import { useRouter } from "expo-router";
import { BorderRadius, Typography, Shadows } from "../constants/styleGuide";
import { trackEvent } from "../utils/analytics";
import { useProgressiveRestrictions } from "../hooks/useProgressiveRestrictions";

interface DemoModeBannerProps {
  onClose?: () => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ onClose }) => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLanguageStore();
  const { isDemoMode, isGuestMode } = useSubscriptionStore();
  const { categories, transactions } = useBudgetStore();
  const { getCurrentRestrictions, checkRestriction } =
    useProgressiveRestrictions();

  const [currentMessage, setCurrentMessage] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  // Different messages based on user progress and restrictions
  const getProgressMessages = () => {
    const categoryProgress = categories.length;
    const transactionProgress = transactions.length;
    const restrictions = getCurrentRestrictions();

    const categoryCheck = checkRestriction("categoryLimit", categoryProgress);
    const transactionCheck = checkRestriction(
      "transactionLimit",
      transactionProgress
    );

    const messages = [
      {
        icon: <Crown size={16} color={colors.primary} />,
        title: isGuestMode ? "Exploring Guest Mode" : "Demo Mode Active",
        subtitle: isGuestMode
          ? "Limited features • Sign up to save your data"
          : "Limited features • Upgrade for full access",
        urgency: "low",
        action: isGuestMode ? "Sign Up Free" : "Upgrade Now",
      },
    ];

    // Show category limit warning when approaching limit
    if (categoryProgress >= Math.max(1, restrictions.categoryLimit - 1)) {
      messages.push({
        icon: <TrendingUp size={16} color="#f39c12" />,
        title: "Category Limit Approaching",
        subtitle:
          categoryCheck.reason ||
          `${categoryProgress}/${restrictions.categoryLimit} categories used`,
        urgency: "medium",
        action:
          categoryCheck.upgradePrompt ||
          (isGuestMode ? "Create Free Account" : "Upgrade to Premium"),
      });
    }

    // Show transaction limit warning
    if (transactionProgress >= Math.max(1, restrictions.transactionLimit - 2)) {
      messages.push({
        icon: <Clock size={16} color="#e74c3c" />,
        title: "Transaction Limit Approaching",
        subtitle:
          transactionCheck.reason ||
          `${transactionProgress}/${restrictions.transactionLimit} transactions used`,
        urgency: "high",
        action:
          transactionCheck.upgradePrompt ||
          (isGuestMode ? "Create Free Account" : "Upgrade to Premium"),
      });
    }

    // Show limit reached
    if (!categoryCheck.allowed || !transactionCheck.allowed) {
      messages.push({
        icon: <Users size={16} color="#e74c3c" />,
        title: "Limit Reached",
        subtitle:
          (!categoryCheck.allowed
            ? categoryCheck.reason
            : transactionCheck.reason) || "Limit reached",
        urgency: "high",
        action:
          (!categoryCheck.allowed
            ? categoryCheck.upgradePrompt
            : transactionCheck.upgradePrompt) ||
          (isGuestMode ? "Create Free Account" : "Upgrade to Premium"),
      });
    }

    return messages;
  };

  const messages = getProgressMessages();

  useEffect(() => {
    // Rotate messages every 4 seconds if multiple messages
    if (messages.length > 1) {
      const interval = setInterval(() => {
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        setCurrentMessage((prev) => (prev + 1) % messages.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [messages.length]);

  useEffect(() => {
    // Pulse animation for urgent messages
    if (messages[currentMessage]?.urgency === "high") {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    }
  }, [currentMessage, messages]);

  const handleUpgrade = () => {
    // Track banner interaction
    trackEvent("demo_banner_click", {
      messageIndex: currentMessage,
      messageTitle: message.title,
      urgency: message.urgency,
      userType: isGuestMode ? "guest" : "demo",
      categoryCount: categories.length,
      transactionCount: transactions.length,
    });

    if (isGuestMode) {
      router.push("/signup" as any);
    } else {
      router.push("/subscription" as any);
    }
  };

  if (!isDemoMode && !isGuestMode) return null;
  if (messages.length === 0) return null;

  const message = messages[currentMessage];
  const urgencyColor =
    message.urgency === "high"
      ? "#e74c3c"
      : message.urgency === "medium"
      ? "#f39c12"
      : colors.primary;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: `${urgencyColor}15`,
          borderLeftColor: urgencyColor,
          transform: [{ translateX: slideAnim }, { scale: pulseAnim }],
        },
      ]}
    >
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          {message.icon}
          <Text style={[styles.messageTitle, { color: urgencyColor }]}>
            {message.title}
          </Text>
        </View>
        <Text style={[styles.messageSubtitle, { color: colors.subtext }]}>
          {message.subtitle}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: urgencyColor }]}
        onPress={handleUpgrade}
      >
        <Text style={styles.actionButtonText}>{message.action}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: BorderRadius.medium,
    borderLeftWidth: 4,
    ...Shadows.small,
  },
  messageContent: {
    flex: 1,
    marginRight: 12,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  messageSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.small,
    ...Shadows.small,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
