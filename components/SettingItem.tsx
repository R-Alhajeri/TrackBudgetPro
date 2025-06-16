import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import {
  Shadows,
  BorderRadius,
  PressableStates,
  Typography,
} from "../constants/styleGuide";

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  testID?: string;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  testID,
}) => {
  const { colors } = useAppTheme();
  const { isRTL } = useLanguageStore();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { borderBottomColor: colors.border },
        isRTL && styles.rtlFlexRowReverse,
        pressed && onPress && PressableStates.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      accessibilityLabel={title}
      accessibilityRole={onPress ? "button" : "none"}
      accessibilityState={{ disabled: !onPress }}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${colors.primary}15` },
        ]}
      >
        {icon}
      </View>

      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.title,
            { color: colors.text },
            Typography.subtitle,
            { marginBottom: subtitle ? 4 : 0 },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { color: colors.subtext },
              Typography.small,
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement ||
        (onPress && (
          <ChevronRight
            size={20}
            color={colors.subtext}
            style={isRTL ? styles.rtlIcon : undefined}
          />
        ))}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  rtlIcon: {
    transform: [{ scaleX: -1 }],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    ...Shadows.small,
  },
  contentContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
});

export default SettingItem;
