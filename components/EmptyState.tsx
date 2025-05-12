import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";

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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.subtext }]}>
          {description}
        </Text>
        <Pressable
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            isRTL && styles.rtlFlexRowReverse,
          ]}
          onPress={onPress}
        >
          <AntDesign name="plus" size={20} color="white" />
          <Text style={styles.buttonText}>{buttonText}</Text>
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
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
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
