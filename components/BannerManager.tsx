import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import {
  Crown,
  TrendingUp,
  Users,
  Star,
  X,
  Clock,
  AlertTriangle,
} from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";
import useSubscriptionStore from "../store/subscription-store";
import useAuthStore from "../store/auth-store";
import useLanguageStore from "../store/language-store";
import useBudgetStore from "../store/budget-store";
import { useRouter } from "expo-router";
import {
  BorderRadius,
  Typography,
  Shadows,
  Spacing,
} from "../constants/styleGuide";
import { trackEvent } from "../utils/analytics";
import { useProgressiveRestrictions } from "../hooks/useProgressiveRestrictions";

const { width: screenWidth } = Dimensions.get("window");

interface BannerManagerProps {
  onClose?: () => void;
}

interface BannerData {
  id: string;
  priority: number; // Higher number = higher priority
  type:
    | "guest-welcome"
    | "guest-urgent"
    | "demo-progress"
    | "demo-limit"
    | "free-upgrade";
  title: string;
  message: string;
  cta: string;
  icon: React.ReactNode;
  color: string;
  dismissible: boolean;
  onPress: () => void;
  onDismiss?: () => void;
}

export const BannerManager: React.FC<BannerManagerProps> = ({ onClose }) => {
  const { colors } = useAppTheme();
  const { t } = useLanguageStore();
  const { isGuestMode, isDemoMode, isSubscribed } = useSubscriptionStore();
  const { userRole, isAuthenticated } = useAuthStore();
  const { categories, transactions } = useBudgetStore();
  const { getCurrentRestrictions, checkRestriction, getProgressionMessage } =
    useProgressiveRestrictions();
  const router = useRouter();

  const [activeBanner, setActiveBanner] = useState<BannerData | null>(null);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(
    new Set()
  );

  // Admins should never see any restriction banners
  const isAdmin = userRole === "admin";
  const shouldShowBanners = !isAdmin;

  const handleSignUp = () => {
    trackEvent("banner_signup_click", {
      bannerType: activeBanner?.type || "unknown",
    });
    router.push("/signup" as any);
  };

  const handleUpgrade = () => {
    trackEvent("banner_upgrade_click", {
      bannerType: activeBanner?.type || "unknown",
    });
    router.push("/subscription" as any);
  };

  const handleDismiss = (bannerId: string) => {
    trackEvent("banner_dismiss", {
      bannerType: activeBanner?.type || "unknown",
      bannerId,
    });

    setDismissedBanners((prev) => new Set([...prev, bannerId]));

    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveBanner(null);
      onClose?.();
    });
  };

  const getAllPossibleBanners = (): BannerData[] => {
    // Admins should never see any banners
    if (isAdmin || !shouldShowBanners) {
      return [];
    }

    const banners: BannerData[] = [];
    const restrictions = getCurrentRestrictions();
    const categoryCount = categories.length;
    const transactionCount = transactions.length;

    // Guest mode banners
    if (isGuestMode) {
      const progression = getProgressionMessage();

      if (progression && progression.type === "urgent") {
        banners.push({
          id: "guest-urgent",
          priority: 100, // Highest priority
          type: "guest-urgent",
          title: progression.title,
          message: progression.message,
          cta: progression.cta,
          icon: <AlertTriangle size={20} color="white" />,
          color: "#e74c3c",
          dismissible: true,
          onPress: handleSignUp,
          onDismiss: () => handleDismiss("guest-urgent"),
        });
      } else {
        banners.push({
          id: "guest-welcome",
          priority: 30,
          type: "guest-welcome",
          title: "👋 Guest Mode",
          message:
            "You're trying TrackBudgetPro! Create a free account to save your progress and unlock more features.",
          cta: "Sign Up Now",
          icon: <Users size={20} color={colors.primary} />,
          color: colors.primary,
          dismissible: true,
          onPress: handleSignUp,
          onDismiss: () => handleDismiss("guest-welcome"),
        });
      }
    }

    // Demo mode banners
    if (isDemoMode) {
      const categoryCheck = checkRestriction("categoryLimit", categoryCount);
      const transactionCheck = checkRestriction(
        "transactionLimit",
        transactionCount
      );

      if (!categoryCheck.allowed || !transactionCheck.allowed) {
        banners.push({
          id: "demo-limit",
          priority: 80,
          type: "demo-limit",
          title: "🚫 Demo Limit Reached",
          message: !categoryCheck.allowed
            ? `You've reached the demo limit of ${restrictions.categoryLimit} categories. Upgrade to create unlimited categories and advanced features!`
            : `You've reached the demo limit of ${restrictions.transactionLimit} transactions. Upgrade to track unlimited expenses and get insights!`,
          cta: "Upgrade Now",
          icon: <AlertTriangle size={20} color="white" />,
          color: "#f39c12",
          dismissible: false,
          onPress: handleUpgrade,
        });
      } else {
        const progress = Math.max(
          categoryCount / restrictions.categoryLimit,
          transactionCount / restrictions.transactionLimit
        );
        if (progress > 0.7) {
          banners.push({
            id: "demo-progress",
            priority: 50,
            type: "demo-progress",
            title: "📊 Demo Progress",
            message: `You're ${Math.round(
              progress * 100
            )}% towards the demo limit. Upgrade now for unlimited tracking!`,
            cta: "Upgrade",
            icon: <TrendingUp size={20} color={colors.primary} />,
            color: colors.primary,
            dismissible: true,
            onPress: handleUpgrade,
            onDismiss: () => handleDismiss("demo-progress"),
          });
        }
      }
    }

    // Guest mode limit banners (higher priority than welcome)
    if (isGuestMode) {
      const categoryCheck = checkRestriction("categoryLimit", categoryCount);
      const transactionCheck = checkRestriction(
        "transactionLimit",
        transactionCount
      );

      if (!categoryCheck.allowed || !transactionCheck.allowed) {
        banners.push({
          id: "guest-limit",
          priority: 90, // Higher than welcome, lower than urgent
          type: "guest-urgent",
          title: `🔒 ${t("guestLimitReached") || "Guest Limit Reached"}`,
          message: !categoryCheck.allowed
            ? t("guestCategoryLimitMessage", {
                limit: restrictions.categoryLimit.toString(),
              }) ||
              `You've reached the guest limit of ${restrictions.categoryLimit} categories. Create a free account to get 3 categories and save your progress!`
            : t("guestTransactionLimitMessage", {
                limit: restrictions.transactionLimit.toString(),
              }) ||
              `You've reached the guest limit of ${restrictions.transactionLimit} transactions. Create a free account to get 15 transactions and save your progress!`,
          cta: t("createFreeAccount") || "Create Free Account",
          icon: <Crown size={20} color={colors.primary} />,
          color: colors.primary,
          dismissible: false,
          onPress: handleSignUp,
        });
      }
    }

    // Free account upgrade prompts (if we add this later)
    if (!isSubscribed && !isGuestMode && !isDemoMode) {
      banners.push({
        id: "free-upgrade",
        priority: 20,
        type: "free-upgrade",
        title: "⭐ Upgrade to Premium",
        message:
          "Unlock cloud sync, unlimited categories, and advanced analytics!",
        cta: "Go Premium",
        icon: <Star size={20} color={colors.primary} />,
        color: colors.primary,
        dismissible: true,
        onPress: handleUpgrade,
        onDismiss: () => handleDismiss("free-upgrade"),
      });
    }

    return banners;
  };

  useEffect(() => {
    const possibleBanners = getAllPossibleBanners()
      .filter((banner) => !dismissedBanners.has(banner.id))
      .sort((a, b) => b.priority - a.priority);

    const newActiveBanner = possibleBanners[0] || null;

    if (newActiveBanner && newActiveBanner.id !== activeBanner?.id) {
      setActiveBanner(newActiveBanner);
    } else if (!newActiveBanner && activeBanner) {
      setActiveBanner(null);
    }
  }, [
    isGuestMode,
    isDemoMode,
    categories.length,
    transactions.length,
    dismissedBanners,
  ]);

  useEffect(() => {
    if (activeBanner) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [activeBanner]);

  if (!activeBanner) return null;

  const isUrgent =
    activeBanner.type === "guest-urgent" ||
    activeBanner.type === "demo-limit" ||
    activeBanner.id === "guest-limit";

  const isLimitBanner =
    activeBanner.type === "demo-limit" || activeBanner.id === "guest-limit";

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: `${activeBanner.color}${isUrgent ? "FF" : "15"}`,
          borderColor: `${activeBanner.color}40`,
          transform: [{ translateY: slideAnim }],
        },
        isUrgent && styles.urgentBanner,
      ]}
    >
      <View style={styles.bannerContent}>
        <View style={styles.bannerIcon}>{activeBanner.icon}</View>
        <View style={styles.bannerText}>
          <Text
            style={[
              styles.bannerTitle,
              { color: isUrgent ? "white" : activeBanner.color },
            ]}
          >
            {activeBanner.title}
          </Text>
          <Text
            style={[
              styles.bannerMessage,
              { color: isUrgent ? "rgba(255,255,255,0.9)" : colors.text },
            ]}
          >
            {activeBanner.message}
          </Text>
        </View>
        <Pressable
          style={[
            styles.bannerCTA,
            {
              backgroundColor: isUrgent
                ? "rgba(255,255,255,0.2)"
                : activeBanner.color,
            },
          ]}
          onPress={activeBanner.onPress}
        >
          <Text
            style={[
              styles.bannerCTAText,
              { color: isUrgent ? "white" : "white" },
            ]}
          >
            {activeBanner.cta}
          </Text>
        </Pressable>
        {activeBanner.dismissible && (
          <Pressable
            style={styles.bannerClose}
            onPress={() => activeBanner.onDismiss?.()}
          >
            <X size={18} color={isUrgent ? "white" : colors.subtext} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    margin: Spacing.m,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    ...Shadows.small,
  },
  urgentBanner: {
    margin: 0,
    marginBottom: Spacing.m,
    borderRadius: 0,
    borderWidth: 0,
    shadowColor: "rgba(0,0,0,0.3)",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  limitBanner: {
    marginHorizontal: 0,
    borderRadius: BorderRadius.large,
    borderWidth: 2,
    ...Shadows.medium,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: Typography.subtitle.fontWeight as any,
    letterSpacing: Typography.subtitle.letterSpacing,
  },
  bannerMessage: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as any,
    letterSpacing: Typography.caption.letterSpacing,
    lineHeight: 16,
  },
  bannerCTA: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.small,
    alignSelf: "flex-start",
  },
  bannerCTAText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "600" as any,
    letterSpacing: Typography.caption.letterSpacing,
  },
  bannerClose: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
});
