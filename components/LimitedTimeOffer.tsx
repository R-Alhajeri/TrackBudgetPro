import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
} from "react-native";
import { Clock, Gift, Crown, X, Zap } from "lucide-react-native";
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

interface LimitedTimeOfferProps {
  visible: boolean;
  onClose: () => void;
  trigger?: string;
  offerType?:
    | "first_time"
    | "extended_session"
    | "high_engagement"
    | "exit_intent";
}

export const LimitedTimeOffer: React.FC<LimitedTimeOfferProps> = ({
  visible,
  onClose,
  trigger = "manual",
  offerType = "first_time",
}) => {
  const { colors } = useAppTheme();
  const { isGuestMode } = useSubscriptionStore();
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [pulseAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(0));

  const getOfferConfig = () => {
    switch (offerType) {
      case "extended_session":
        return {
          title: "🚀 You're on fire!",
          subtitle: "Special offer for engaged users",
          discount: "30% OFF",
          originalPrice: "$43.09",
          offerPrice: "$30.16",
          features: [
            "Everything you've built stays forever",
            "Unlimited categories & transactions",
            "Advanced analytics & insights",
            "Export & backup capabilities",
          ],
          urgency: "This session only!",
          cta: "Claim 30% Off Now",
        };
      case "high_engagement":
        return {
          title: "🎯 Perfect timing!",
          subtitle: "You're really getting the hang of this",
          discount: "FREE MONTH",
          originalPrice: "$3.99/month",
          offerPrice: "FREE trial",
          features: [
            "Keep all your progress",
            "Try premium features risk-free",
            "Cancel anytime",
            "No credit card required",
          ],
          urgency: "Limited time offer!",
          cta: "Start Free Trial",
        };
      case "exit_intent":
        return {
          title: "⚡ Wait! Don't lose your progress",
          subtitle: "Last chance to save everything",
          discount: "50% OFF",
          originalPrice: "$43.09",
          offerPrice: "$21.55",
          features: [
            "Save all your categories & transactions",
            "Unlock premium features instantly",
            "Sync across all devices",
            "30-day money-back guarantee",
          ],
          urgency: "This offer expires when you leave!",
          cta: "Save My Progress",
        };
      default:
        return {
          title: "🎉 Welcome offer!",
          subtitle: "Special discount for new users",
          discount: "20% OFF",
          originalPrice: "$43.09",
          offerPrice: "$34.47",
          features: [
            "Unlimited categories & transactions",
            "Advanced analytics",
            "Export capabilities",
            "Multi-device sync",
          ],
          urgency: "First-time users only!",
          cta: "Claim Welcome Discount",
        };
    }
  };

  const offer = getOfferConfig();

  useEffect(() => {
    if (visible) {
      // Scale in animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Pulse animation for urgency
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();

      // Countdown timer (only for certain offers)
      if (offerType === "extended_session" || offerType === "exit_intent") {
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              onClose();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }

      // Track offer view
      trackEvent("limited_offer_shown", {
        offerType,
        trigger,
        discount: offer.discount,
        userType: isGuestMode ? "guest" : "demo",
      });
    } else {
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, offerType]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAccept = () => {
    trackEvent("limited_offer_accepted", {
      offerType,
      trigger,
      discount: offer.discount,
      timeLeft,
      userType: isGuestMode ? "guest" : "demo",
    });

    onClose();

    if (isGuestMode) {
      router.push("/signup" as any);
    } else {
      router.push("/subscription" as any);
    }
  };

  const handleDecline = () => {
    trackEvent("limited_offer_declined", {
      offerType,
      trigger,
      discount: offer.discount,
      timeLeft,
      userType: isGuestMode ? "guest" : "demo",
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleDecline}
    >
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.background,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header with countdown */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <View style={styles.headerContent}>
              <Gift size={24} color="white" />
              <Text style={styles.headerTitle}>{offer.title}</Text>
            </View>
            {(offerType === "extended_session" ||
              offerType === "exit_intent") && (
              <View style={styles.countdown}>
                <Clock size={16} color="white" />
                <Text style={styles.countdownText}>{formatTime(timeLeft)}</Text>
              </View>
            )}
            <Pressable onPress={handleDecline} style={styles.closeButton}>
              <X size={20} color="white" />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              {offer.subtitle}
            </Text>

            {/* Discount highlight */}
            <Animated.View
              style={[
                styles.discountBadge,
                {
                  backgroundColor: "#e74c3c",
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Zap size={20} color="white" />
              <Text style={styles.discountText}>{offer.discount}</Text>
            </Animated.View>

            {/* Pricing */}
            <View style={styles.pricing}>
              <Text style={[styles.originalPrice, { color: colors.subtext }]}>
                {offer.originalPrice}
              </Text>
              <Text style={[styles.offerPrice, { color: colors.primary }]}>
                {offer.offerPrice}
              </Text>
            </View>

            {/* Features */}
            <View style={styles.features}>
              {offer.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Crown size={16} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {/* Urgency */}
            <Text style={[styles.urgency, { color: "#e74c3c" }]}>
              ⚡ {offer.urgency}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.acceptButton, { backgroundColor: colors.primary }]}
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>{offer.cta}</Text>
            </Pressable>

            <Pressable style={styles.declineButton} onPress={handleDecline}>
              <Text
                style={[styles.declineButtonText, { color: colors.subtext }]}
              >
                Maybe later
              </Text>
            </Pressable>
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
    width: "90%",
    maxWidth: 400,
    borderRadius: BorderRadius.large,
    ...Shadows.large,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.l,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: Spacing.s,
  },
  countdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    marginRight: Spacing.s,
  },
  countdownText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: Spacing.l,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.l,
  },
  discountBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.l,
  },
  discountText: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    marginLeft: Spacing.s,
  },
  pricing: {
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: "line-through",
    marginBottom: 4,
  },
  offerPrice: {
    fontSize: 24,
    fontWeight: "700",
  },
  features: {
    alignSelf: "stretch",
    marginBottom: Spacing.l,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  featureText: {
    marginLeft: Spacing.s,
    fontSize: 14,
  },
  urgency: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    padding: Spacing.l,
    paddingTop: 0,
  },
  acceptButton: {
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.medium,
    alignItems: "center",
    marginBottom: Spacing.s,
    ...Shadows.medium,
  },
  acceptButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  declineButton: {
    paddingVertical: Spacing.s,
    alignItems: "center",
  },
  declineButtonText: {
    fontSize: 14,
  },
});
