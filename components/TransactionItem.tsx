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
import { AntDesign } from "@expo/vector-icons";
import { Transaction } from "@/types/budget";
import useBudgetStore from "@/store/budget-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onDelete,
}) => {
  const { categories, baseCurrency, currencies, receipts } = useBudgetStore();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  const category = categories.find((c) => c.id === transaction.categoryId);
  const receiptImage = receipts[transaction.id];

  const date = new Date(transaction.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Get currency information
  const currencySymbol =
    currencies.find((c) => c.code === baseCurrency)?.symbol || baseCurrency;

  // Replace t('confirmDelete') and similar with fallback strings if not in translations
  const confirmDelete = t("confirmDelete") || "Delete Transaction";
  const areYouSureDeleteTransaction =
    t("areYouSureDeleteTransaction") ||
    "Are you sure you want to delete this transaction?";
  const failedToLoadReceiptImage =
    t("failedToLoadReceiptImage") || "Failed to load receipt image.";
  const unknown = t("unknown") || "Unknown";

  const handleDelete = () => {
    Alert.alert(confirmDelete, areYouSureDeleteTransaction, [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), onPress: onDelete, style: "destructive" },
    ]);
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={[styles.content, isRTL && styles.rtlFlexRowReverse]}>
        <View style={styles.mainInfo}>
          <Text style={[styles.description, { color: colors.text }]}>
            {transaction.description}
          </Text>
          <Text style={[styles.category, { color: colors.subtext }]}>
            {category?.name || "Unknown Category"}
          </Text>
        </View>

        <View style={styles.rightContent}>
          <Text style={[styles.amount, { color: colors.text }]}>
            -{currencySymbol}
            {transaction.amount.toFixed(2)}
          </Text>
          <Text style={[styles.date, { color: colors.subtext }]}>
            {formattedDate} • {formattedTime}
          </Text>
        </View>
      </View>

      <View style={[styles.actions, isRTL && styles.rtlFlexRowReverse]}>
        {receiptImage && (
          <Pressable
            style={styles.receiptButton}
            onPress={() => setReceiptModalVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AntDesign name="filetext1" size={16} color={colors.primary} />
          </Pressable>
        )}

        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AntDesign name="delete" size={16} color={colors.danger} />
        </Pressable>
      </View>

      {/* Receipt Modal */}
      <Modal
        visible={receiptModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: "rgba(0, 0, 0, 0.7)" },
          ]}
        >
          <View style={styles.modalContent}>
            <View
              style={[styles.modalHeader, isRTL && styles.rtlFlexRowReverse]}
            >
              <Text style={styles.modalTitle}>{t("receipt")}</Text>
              <Pressable onPress={() => setReceiptModalVisible(false)}>
                <AntDesign name="close" size={24} color="white" />
              </Pressable>
            </View>

            <Image
              source={{ uri: receiptImage }}
              style={styles.receiptImage}
              resizeMode="contain"
              onError={(error) => {
                console.error("Error loading receipt image:", error);
                Alert.alert(t("error"), failedToLoadReceiptImage, [
                  { text: "OK" },
                ]);
                setReceiptModalVisible(false);
              }}
            />

            {transaction.receiptData && (
              <View style={styles.receiptData}>
                <Text style={styles.receiptDataText}>
                  {t("merchant")}: {transaction.receiptData.merchant || unknown}
                </Text>
                <Text style={styles.receiptDataText}>
                  {t("total")}: {currencySymbol}
                  {transaction.receiptData.total?.toFixed(2) || "N/A"}
                </Text>
              </View>
            )}

            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setReceiptModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t("close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
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
    marginRight: 8,
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    marginBottom: 2,
  },
  rightContent: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    marginLeft: 12,
    marginRight: 12,
  },
  receiptButton: {
    padding: 8,
    marginRight: 4,
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  receiptImage: {
    width: "100%",
    height: 400,
  },
  receiptData: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  receiptDataText: {
    color: "white",
    fontSize: 14,
    marginBottom: 4,
  },
  closeButton: {
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default TransactionItem;
