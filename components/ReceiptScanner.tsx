import React from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";

interface ReceiptScannerProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (imageUri: string, extractedData?: any) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  visible,
  onClose,
  onCapture,
}) => {
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();

  // Mock function to simulate capturing a receipt
  const handleMockCapture = () => {
    // Create a mock image URI
    const mockImageUri = "https://example.com/mock-receipt.jpg";

    // Create mock extracted data
    const mockExtractedData = {
      merchant: "Coffee Shop",
      total: 12.99,
      date: new Date().toISOString().split("T")[0],
      items: [
        { name: "Coffee", price: 4.99 },
        { name: "Sandwich", price: 8.0 },
      ],
    };

    // Call the onCapture callback with mock data
    onCapture(mockImageUri, mockExtractedData);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, isRTL && styles.rtlFlexRowReverse]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <AntDesign name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("scanningReceipt")}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View
            style={[
              styles.comingSoonBadge,
              {
                backgroundColor: `${colors.warning}20`,
                borderColor: colors.warning,
              },
            ]}
          >
            <Feather
              name="alert-triangle"
              size={20}
              color={colors.warning}
              style={styles.comingSoonIcon}
            />
            <Text
              style={[styles.comingSoonBadgeText, { color: colors.warning }]}
            >
              Coming Soon
            </Text>
          </View>

          <Text style={[styles.comingSoonText, { color: colors.text }]}>
            Receipt Scanning
          </Text>

          <Text style={[styles.descriptionText, { color: colors.subtext }]}>
            This feature is currently under development and will be available in
            a future update. It will allow you to scan receipts and
            automatically extract transaction details.
          </Text>

          <View
            style={[
              styles.featurePreview,
              {
                backgroundColor: `${colors.primary}10`,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather
              name="camera"
              size={24}
              color={colors.primary}
              style={styles.featureIcon}
            />
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              Planned Features:
            </Text>
            <View style={styles.featureList}>
              <Text style={[styles.featureItem, { color: colors.text }]}>
                • Automatic merchant detection
              </Text>
              <Text style={[styles.featureItem, { color: colors.text }]}>
                • Total amount extraction
              </Text>
              <Text style={[styles.featureItem, { color: colors.text }]}>
                • Date and time recognition
              </Text>
              <Text style={[styles.featureItem, { color: colors.text }]}>
                • Item categorization
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.mockButton, { backgroundColor: colors.primary }]}
              onPress={handleMockCapture}
            >
              <Text style={styles.mockButtonText}>Use Demo Receipt</Text>
            </Pressable>

            <Pressable
              style={[
                styles.closeModalButton,
                { backgroundColor: colors.border },
              ]}
              onPress={onClose}
            >
              <Text
                style={[styles.closeModalButtonText, { color: colors.text }]}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  comingSoonIcon: {
    marginRight: 6,
  },
  comingSoonBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  descriptionText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 24,
  },
  featurePreview: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 24,
  },
  featureIcon: {
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  featureList: {
    alignSelf: "flex-start",
    width: "100%",
  },
  featureItem: {
    fontSize: 14,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  mockButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  mockButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  closeModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ReceiptScanner;
