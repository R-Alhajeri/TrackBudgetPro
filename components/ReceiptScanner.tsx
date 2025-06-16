import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Clock, Camera } from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";

interface ReceiptScannerProps {
  onClose?: () => void;
  visible?: boolean;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onClose }) => {
  const { colors } = useAppTheme();
  const { t } = useLanguageStore();

  // Simple "Coming Soon" UI implementation
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.comingSoonContainer}>
        <Clock size={50} color={colors.primary} style={styles.icon} />
        <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
          {t("comingSoon") || "Coming Soon"}
        </Text>
        <Text style={[styles.comingSoonText, { color: colors.text }]}>
          {t("receiptScannerComingSoon") ||
            "The receipt scanner feature is currently in development. Stay tuned for updates!"}
        </Text>
        <Camera size={40} color={colors.text} style={styles.cameraIcon} />
        <Pressable
          style={[styles.closeButton, { backgroundColor: colors.primary }]}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>{t("close") || "Close"}</Text>
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
  },
  comingSoonContainer: {
    width: "85%",
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF15",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#FFFFFF30",
  },
  icon: {
    marginBottom: 20,
    opacity: 0.9,
  },
  cameraIcon: {
    marginTop: 28,
    marginBottom: 16,
    opacity: 0.7,
    transform: [{ rotate: "-10deg" }],
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  closeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default ReceiptScanner;
