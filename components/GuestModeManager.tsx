import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { Crown, TrendingUp, Users, Star, X, Clock } from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";
import useSubscriptionStore from "../store/subscription-store";
import { useRouter } from "expo-router";
import { BorderRadius, Typography, Shadows } from "../constants/styleGuide";
import { trackEvent } from "../utils/analytics";
import { useProgressiveRestrictions } from "../hooks/useProgressiveRestrictions";

const { width: screenWidth } = Dimensions.get("window");

interface GuestModeManagerProps {
  onClose?: () => void;
}

export const GuestModeManager: React.FC<GuestModeManagerProps> = ({
  onClose,
}) => {
  const { colors } = useAppTheme();
  const { isGuestMode, isDemoMode } = useSubscriptionStore();
  const { getProgressionMessage, checkRestriction } =
    useProgressiveRestrictions();
  const router = useRouter();

  const [showPersistentBanner, setShowPersistentBanner] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [interactionCount, setInteractionCount] = useState(0);

  useEffect(() => {
    // Check for progression message periodically
    const timer = setInterval(() => {
      const progression = getProgressionMessage();
      if (progression && progression.type === "urgent") {
        setShowPersistentBanner(true);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(timer);
  }, [getProgressionMessage]);

  useEffect(() => {
    if (showPersistentBanner) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showPersistentBanner]);

  const handleInteraction = () => {
    setInteractionCount((prev) => prev + 1);

    trackEvent("guest_mode_interaction", {
      interactionCount: interactionCount + 1,
    });
  };

  const handleSignUp = () => {
    const progression = getProgressionMessage();
    trackEvent("guest_mode_signup_click", {
      interactionCount: interactionCount,
      trigger: showPersistentBanner ? "persistent_banner" : "feature_teaser",
      progressionType: progression?.type || "initial",
    });
    router.push("/signup" as any);
  };

  const handleDismiss = () => {
    trackEvent("guest_mode_banner_dismiss", {
      interactionCount: interactionCount,
    });
    setShowPersistentBanner(false);
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start();
    onClose?.();
  };

  const getDisplayMessage = () => {
    const progression = getProgressionMessage();
    if (progression) {
      return {
        title: progression.title,
        subtitle: progression.message,
        cta: progression.cta,
        urgency: progression.type,
      };
    }

    return {
      title: "👋 Welcome to TrackBudgetPro",
      subtitle:
        "You're in guest mode. Create a free account to save your progress and unlock more features!",
      cta: "Create Free Account",
      urgency: "low" as const,
    };
  };

  if (!isGuestMode) return null;

  const message = getDisplayMessage();
  const urgencyColor =
    message.urgency === "urgent"
      ? "#e74c3c"
      : message.urgency === "warning"
      ? "#f39c12"
      : colors.primary;

  return (
    <>
      {/* Persistent Banner (shown during urgent engagement) */}
      {showPersistentBanner && (
        <Animated.View
          style={[
            styles.persistentBanner,
            {
              backgroundColor: urgencyColor,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerIcon}>
              <Clock size={20} color="white" />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>{message.title}</Text>
              <Text style={styles.bannerSubtitle}>{message.subtitle}</Text>
            </View>
            <Pressable style={styles.bannerCTA} onPress={handleSignUp}>
              <Text style={styles.bannerCTAText}>Sign Up</Text>
            </Pressable>
            <Pressable style={styles.bannerClose} onPress={handleDismiss}>
              <X size={18} color="white" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Feature Teasers */}
      <FeatureTeasers
        onInteraction={handleInteraction}
        onSignUp={handleSignUp}
      />
    </>
  );
};

// Component for showing feature teasers during guest mode
const FeatureTeasers: React.FC<{
  onInteraction: () => void;
  onSignUp: () => void;
}> = ({ onInteraction, onSignUp }) => {
  const { colors } = useAppTheme();
  const { checkRestriction } = useProgressiveRestrictions();
  const [currentTeaser, setCurrentTeaser] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  const categoryRestriction = checkRestriction("categoryLimit", 0);
  const transactionRestriction = checkRestriction("transactionLimit", 0);
  const syncRestriction = checkRestriction("syncAllowed");

  const teasers = [
    {
      icon: <Star size={24} color={colors.primary} />,
      title: "More Categories",
      description:
        categoryRestriction.upgradePrompt ||
        "Get more categories with a free account",
      lockReason: categoryRestriction.reason || "Limited in guest mode",
    },
    {
      icon: <TrendingUp size={24} color={colors.primary} />,
      title: "More Transactions",
      description:
        transactionRestriction.upgradePrompt ||
        "Track more transactions with a free account",
      lockReason: transactionRestriction.reason || "Limited in guest mode",
    },
    {
      icon: <Users size={24} color={colors.primary} />,
      title: "Cloud Sync",
      description:
        syncRestriction.upgradePrompt ||
        "Access your budget from any device with premium",
      lockReason: syncRestriction.reason || "Premium feature",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentTeaser((prev) => (prev + 1) % teasers.length);
    }, 6000); // Show each teaser for 6 seconds

    return () => clearInterval(interval);
  }, []);

  const teaser = teasers[currentTeaser];

  return (
    <Animated.View
      style={[
        styles.featureTeaser,
        {
          backgroundColor: colors.card,
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.teaserIcon}>{teaser.icon}</View>
      <View style={styles.teaserContent}>
        <Text style={[styles.teaserTitle, { color: colors.text }]}>
          {teaser.title}
        </Text>
        <Text style={[styles.teaserDescription, { color: colors.subtext }]}>
          {teaser.description}
        </Text>
        <Text style={[styles.teaserLock, { color: colors.primary }]}>
          🔒 {teaser.lockReason}
        </Text>
      </View>
      <Pressable
        style={[styles.teaserCTA, { backgroundColor: colors.primary }]}
        onPress={() => {
          onInteraction();
          onSignUp();
        }}
      >
        <Text style={styles.teaserCTAText}>Unlock</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  persistentBanner: {
    position: "relative", // Changed from absolute to avoid overlap
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerIcon: {
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  bannerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
  },
  bannerCTA: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.small,
    marginRight: 8,
  },
  bannerCTAText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  bannerClose: {
    padding: 4,
  },
  featureTeaser: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 16,
    borderRadius: BorderRadius.medium,
    ...Shadows.small,
  },
  teaserIcon: {
    marginRight: 16,
  },
  teaserContent: {
    flex: 1,
  },
  teaserTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  teaserDescription: {
    fontSize: 14,
    marginBottom: 6,
  },
  teaserLock: {
    fontSize: 12,
    fontWeight: "500",
  },
  teaserCTA: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.small,
  },
  teaserCTAText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
