import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { CreditCard } from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";
import useSubscriptionStore from "../store/subscription-store";
import useLanguageStore from "../store/language-store";
import { useRouter } from "expo-router";
import {
  Typography,
  Spacing,
  BorderRadius,
  ButtonStyles,
  PressableStates,
  Shadows,
} from "../constants/styleGuide";

export const SubscriptionPaywall = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLanguageStore();

  const handleSubscribe = () => {
    router.push("../subscription");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CreditCard size={60} color={colors.primary} strokeWidth={1.5} />
      <Text
        style={[
          Typography.header,
          {
            color: colors.primary,
            marginTop: Spacing.l,
            marginBottom: Spacing.m,
            textAlign: "center",
          },
        ]}
      >
        {t("success")}
      </Text>
      <Text
        style={[
          Typography.body,
          {
            color: colors.text,
            marginBottom: Spacing.l,
            textAlign: "center",
            paddingHorizontal: Spacing.s,
            lineHeight: 22,
          },
        ]}
      >
        {t("somethingWentWrong")}
      </Text>
      <Pressable
        style={({ pressed }) => [
          ButtonStyles.primary(colors.primary),
          { width: "80%", marginBottom: Spacing.m },
          pressed && PressableStates.pressed,
        ]}
        onPress={handleSubscribe}
        accessibilityRole="button"
      >
        <Text style={[Typography.subtitle, { color: colors.background }]}>
          {t("confirm")}
        </Text>
      </Pressable>
      <Text
        style={[
          Typography.caption,
          {
            color: colors.text,
            textAlign: "center",
            paddingHorizontal: Spacing.m,
            lineHeight: 20,
          },
        ]}
      >
        {t("tryAgain")}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
});

export default SubscriptionPaywall;
