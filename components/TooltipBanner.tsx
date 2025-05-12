import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

interface TooltipBannerProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  type?: "info" | "warning" | "error";
}

const colors = {
  info: "#007bff",
  warning: "#ffc107",
  error: "#dc3545",
};

export default function TooltipBanner({
  message,
  visible,
  onClose,
  type = "info",
}: TooltipBannerProps) {
  if (!visible) return null;
  return (
    <View style={[styles.banner, { backgroundColor: colors[type] }]}>
      <Text style={styles.text}>{message}</Text>
      <Pressable
        onPress={onClose}
        style={styles.closeButton}
        accessibilityLabel="Close banner"
      >
        <Text style={styles.closeText}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    margin: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 1000,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
  closeText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
});
