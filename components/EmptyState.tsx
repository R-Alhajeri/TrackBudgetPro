import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import { Shadows, Typography, PressableStates } from "../constants/styleGuide";

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onPress: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonText,
  onPress,
}) => {
  const { colors } = useAppTheme();
  const { isRTL } = useLanguageStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.content,
          { backgroundColor: colors.card, shadowColor: colors.primary },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.subtext }]}>
          {description}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
            isRTL && styles.rtlFlexRowReverse,
            Shadows.medium,
            pressed && PressableStates.pressed,
          ]}
          onPress={onPress}
        >
          <Plus size={20} color="white" />
          <Text style={[styles.buttonText]}>{buttonText}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 320,
    padding: 28,
    borderRadius: 18,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    marginTop: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 24,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 8,
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
    marginRight: 8,
  },
});

export default EmptyState;
