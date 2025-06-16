import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Transaction, Category } from "../types/budget";
import { X } from "lucide-react-native";

interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
  colors: any;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  visible,
  transaction,
  categories,
  onClose,
  colors,
}) => {
  if (!transaction) return null;
  const category = categories.find((c) => c.id === transaction.categoryId);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: colors.modalOverlay || "rgba(0,0,0,0.5)" },
        ]}
      >
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Transaction Details
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={22} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.content}>
            <Text style={[styles.label, { color: colors.subtext }]}>
              Description
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {transaction.description}
            </Text>
            <Text style={[styles.label, { color: colors.subtext }]}>
              Amount
            </Text>
            <Text
              style={[
                styles.value,
                {
                  color:
                    transaction.type === "expense"
                      ? colors.danger
                      : colors.success,
                },
              ]}
            >
              ${transaction.amount.toFixed(2)}
            </Text>
            <Text style={[styles.label, { color: colors.subtext }]}>Date</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {new Date(transaction.date).toLocaleString()}
            </Text>
            <Text style={[styles.label, { color: colors.subtext }]}>
              Category
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {category ? category.name : transaction.categoryId}
            </Text>
            <Text style={[styles.label, { color: colors.subtext }]}>Type</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {transaction.type === "expense" ? "Expense" : "Income"}
            </Text>
            {transaction.currency && (
              <>
                <Text style={[styles.label, { color: colors.subtext }]}>
                  Currency
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {transaction.currency}
                </Text>
              </>
            )}
            {transaction.userId && (
              <>
                <Text style={[styles.label, { color: colors.subtext }]}>
                  User ID
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {transaction.userId}
                </Text>
              </>
            )}
            {transaction.receiptImageUri && (
              <>
                <Text style={[styles.label, { color: colors.subtext }]}>
                  Receipt
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  [Receipt image available]
                </Text>
              </>
            )}
          </ScrollView>
        </View>
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
  modal: {
    width: "90%",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    marginTop: 2,
  },
});

export default TransactionDetailModal;
