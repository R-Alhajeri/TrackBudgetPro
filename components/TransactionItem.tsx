import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Modal,
  Alert,
} from "react-native";
import { Trash2, Receipt, X } from "lucide-react-native";
import { Transaction, Category, Currency } from "../types/budget";
import useBudgetStore from "../store/budget-store";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import {
  Typography,
  BorderRadius,
  Shadows,
  Spacing,
  PressableStates,
} from "../constants/styleGuide";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: () => void;
}

// Updated styles and layout to match the legacy design while preserving technical enhancements.
const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onDelete,
}) => {
  const { categories, baseCurrency, currencies } = useBudgetStore();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  const category = categories.find(
    (c: Category) => c.id === transaction.categoryId
  );
  const receiptImageUri = transaction.receiptImageUri || null;

  const date = new Date(transaction.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const currencySymbol =
    currencies.find((c: Currency) => c.code === baseCurrency)?.symbol ||
    baseCurrency;

  const handleDelete = () => {
    Alert.alert(t("confirmDelete"), t("areYouSureDeleteTransaction"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), onPress: onDelete, style: "destructive" },
    ]);
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={[styles.content, isRTL && styles.rtlFlexRowReverse]}>
        <View style={styles.mainInfo}>
          <Text
            style={[
              styles.description,
              { color: colors.text },
              {
                fontSize: (Typography.subtitle as any).fontSize,
                fontWeight: (Typography.subtitle as any).fontWeight,
                lineHeight: (Typography.subtitle as any).lineHeight,
              },
            ]}
          >
            {transaction.description}
          </Text>
          <Text
            style={[
              styles.category,
              { color: colors.subtext },
              {
                fontSize: (Typography.caption as any).fontSize,
                fontWeight: (Typography.caption as any).fontWeight,
                lineHeight: (Typography.caption as any).lineHeight,
              },
            ]}
          >
            {category?.name || t("unknown")}
          </Text>
        </View>
        <View style={styles.rightContent}>
          <Text
            style={[
              styles.amount,
              { color: colors.text },
              {
                fontSize: (Typography.subtitle as any).fontSize,
                fontWeight: (Typography.subtitle as any).fontWeight,
                lineHeight: (Typography.subtitle as any).lineHeight,
              },
            ]}
          >
            -{currencySymbol}
            {transaction.amount.toFixed(2)}
          </Text>
          <Text
            style={[
              styles.date,
              { color: colors.subtext },
              {
                fontSize: (Typography.caption as any).fontSize,
                fontWeight: (Typography.caption as any).fontWeight,
                lineHeight: (Typography.caption as any).lineHeight,
              },
            ]}
          >
            {formattedDate} {formattedTime}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {receiptImageUri && (
          <Pressable
            style={styles.receiptButton}
            onPress={() => setReceiptModalVisible(true)}
          >
            <Receipt size={18} color={colors.primary} />
          </Pressable>
        )}
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={18} color={colors.danger} />
        </Pressable>
      </View>

      {receiptImageUri && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={receiptModalVisible}
          onRequestClose={() => setReceiptModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t("receipt")}</Text>
                <Pressable onPress={() => setReceiptModalVisible(false)}>
                  <X size={20} color="white" />
                </Pressable>
              </View>
              <Image
                source={{ uri: receiptImageUri }}
                style={styles.receiptImage}
                resizeMode="contain"
              />
              <Pressable
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setReceiptModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>{t("close")}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  mainInfo: {
    flex: 1,
    marginRight: Spacing.m,
    marginLeft: Spacing.m,
  },
  description: {
    marginBottom: Spacing.xs,
    // Using Typography.subtitle
  },
  category: {
    marginBottom: Spacing.xs,
    // Using Typography.caption
  },
  rightContent: {
    alignItems: "flex-end",
  },
  amount: {
    marginBottom: Spacing.xs,
    // Using Typography.subtitle
  },
  date: {
    // Using Typography.caption
  },
  actions: {
    flexDirection: "row",
    marginLeft: Spacing.m,
    alignItems: "center",
  },
  receiptButton: {
    padding: Spacing.s,
    marginRight: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.s,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#000",
    borderRadius: BorderRadius.large,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  receiptImage: {
    width: "100%",
    height: 400,
  },
  receiptData: {
    padding: Spacing.m,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  receiptDataText: {
    color: "white",
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: 0.2,
    marginBottom: Spacing.xs,
  },
  closeButton: {
    margin: Spacing.m,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.small,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default TransactionItem;
